import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
_client = None

def get_client():
  global _client
  if _client is None:
    _client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
  return _client

def get_level_id(level: int) -> str | None:
  result = get_client().table("levels").select("id").eq("level", level).execute()
  return result.data[0]["id"] if result.data else None

def upsert_player(player: dict) -> None:
  get_client().table("players").upsert(player, on_conflict="external_id").execute()

# Fetched once per run, cached by the caller -- only 3 rows, no reason to re-query per player
def get_levels() -> list[dict]:
  result = get_client().table("levels").select("level, min_avg, max_avg, min_era, max_era").execute()
  return result.data

def get_existing_external_ids() -> set[str]:
  result = get_client().table("players").select("external_id").execute()
  return {row["external_id"] for row in result.data}

def seed_mlb_teams(teams: list[dict]) -> None:
  rows = [
    {"external_id": str(t["id"]), "name": t["name"], "abbreviation": t.get("abbreviation")}
    for t in teams
  ]
  get_client().table("mlb_teams").upsert(rows, on_conflict="external_id").execute()

def seed_award_types(awards: list[dict]) -> None:
  rows = []
  for a in awards:
    league_id = str(a["league"]["id"]) if "league" in a else None
    rows.append({
      "external_id": a["id"],
      "name": a["name"],
      "league": league_id,
      "active": a.get("active", False),
    })
  get_client().table("award_types").upsert(rows, on_conflict="external_id").execute()

def record_failed_player(player_id: str, error: str) -> None:
  get_client().table("etl_failed_players").upsert(
    {"player_id": player_id, "last_error": error, "last_attempted_at": "now()"}, on_conflict="player_id"
  ).execute()

def clear_failed_player(player_id: str) -> None:
  get_client().table("etl_failed_players").delete().eq("player_id", player_id).execute()

def get_failed_player_ids() -> list[str]:
  result = get_client().table("etl_failed_players").select("player_id").execute()
  return [row["player_id"] for row in result.data]

def get_config_value(key: str, default: str | None = None) -> str | None:
  result = get_client().table("system_config").select("value").eq("key", key).execute()
  if result.data:
    return result.data[0]["value"]

  return default

def set_config(key: str, value: str) -> None:
  get_client().table("system_config").upsert({"key": key, "value": value}, on_conflict="key").execute()

def get_player_uuid(external_id: str) -> str | None:
  result = get_client().table("players").select("id").eq("external_id", external_id).execute()
  return result.data[0]["id"] if result.data else None

def get_team_uuid(external_id: str) -> str | None:
  result = get_client().table("mlb_teams").select("id").eq("external_id", external_id).execute()
  return result.data[0]["id"] if result.data else None

def upsert_team_tenure(player_uuid: str, team_uuid: str, start_date: str, end_date: str) -> None:
  row = {"player_id": player_uuid, "mlb_team_id": team_uuid, "start_date": start_date, "end_date": end_date}
  get_client().table("player_mlb_team_history").upsert(row, on_conflict="player_id,mlb_team_id,start_date").execute()

def get_award_type_uuid(external_id: str) -> str | None:
  result = get_client().table("award_types").select("id").eq("external_id", external_id).execute()
  return result.data[0]["id"] if result.data else None

def get_player_ids_missing_team_history() -> list[str]:
  all_players = get_client().table("players").select("id, external_id").execute().data
  history_rows = get_client().table("player_mlb_team_history").select("player_id").execute().data
  ids_with_history = {row["player_id"] for row in history_rows}
  return [p["external_id"] for p in all_players if p["id"] not in ids_with_history]