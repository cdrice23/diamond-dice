import json
import sys

from datetime import datetime, timezone

from config import TEAM_BATCH_SIZE
from mlb_client import get_all_team_ids, get_historical_roster, get_all_teams, get_all_awards, mlb_get, MlbApiError, CircuitBreakerAbort
from db import get_levels, get_existing_external_ids, get_config_value, set_config, seed_mlb_teams, seed_award_types, get_client
from pipeline import process_roster, write_run_summary


def get_refresh_end_date(season: int) -> str:
  return f"{season}-11-01"

def get_target_season_for_refresh() -> int | None:
  now = datetime.now(timezone.utc)
  season_end_cutoff = datetime(now.year, 11, 1, tzinfo=timezone.utc)
  if now < season_end_cutoff:
    return None
  return now.year

def get_player_uuid(external_id: str) -> str | None:
  result = get_client().table("players").select("id").eq("external_id", external_id).execute()
  return result.data[0]["id"] if result.data else None

def get_award_type_uuid(external_id: str) -> str | None:
  result = get_client().table("award_types").select("id").eq("external_id", external_id).execute()
  return result.data[0]["id"] if result.data else None

def seed_player_awards() -> None:
  print("--- Seeding player awards ---")
  for award in get_all_awards():
    award_type_id = get_award_type_uuid(award["id"])
    if not award_type_id:
      continue

    try:
      data = mlb_get(f"/awards/{award['id']}/recipients")
    except MlbApiError as error:
      print(f"  SKIPPED award {award['id']}: {error}")
      continue

    for recipient in data.get("awards", []):
      player_id = get_player_uuid(str(recipient["player"]["id"]))
      if not player_id:
        continue  # not in our qualified pool -- expected, not an error

      row = {"player_id": player_id, "award_type_id": award_type_id, "season": int(recipient["season"])}
      get_client().table("player_awards").upsert(row, on_conflict="player_id,award_type_id,season").execute()

  print("Player awards seeding complete.")

def run_annual_refresh_batch() -> None:
  seed_mlb_teams(get_all_teams())
  seed_award_types(get_all_awards())

  expected_season = get_target_season_for_refresh()
  if expected_season is None:
    print("Current season has not concluded yet -- nothing to refresh.")
    return

  levels = get_levels()
  existing_ids = get_existing_external_ids()
  team_ids = sorted(get_all_team_ids())

  stored_season = int(get_config_value("etl_refresh_target_season", default=str(expected_season)))

  if stored_season < expected_season:
    stored_season = expected_season
    set_config("etl_refresh_target_season", str(stored_season))
    set_config("etl_refresh_completed_teams", json.dumps([]))
    set_config("etl_refresh_awards_seeded", "false")

  completed_teams = set(json.loads(get_config_value("etl_refresh_completed_teams", default="[]")))
  remaining_teams = [t for t in team_ids if str(t) not in completed_teams]

  if not remaining_teams:
    seed_player_awards()
    print(f"Annual refresh for season {stored_season} already complete.")
    return

  end_date = get_refresh_end_date(stored_season)

  try:
    batch = remaining_teams[:TEAM_BATCH_SIZE]
    for team_id in batch:
      print(f"--- Refresh season {stored_season}, team {team_id} ---")
      roster = get_historical_roster(team_id, stored_season)
      process_roster(roster, levels, existing_ids, end_date=end_date, skip_existing=False)
      completed_teams.add(str(team_id))
      set_config("etl_refresh_completed_teams", json.dumps(sorted(completed_teams)))

    if len(completed_teams) >= len(team_ids):
      print(f"Annual refresh for season {stored_season} complete.")
  finally:
    write_run_summary(existing_ids, stored_season)

if __name__ == "__main__":
  try:
    run_annual_refresh_batch()
  except CircuitBreakerAbort as error:
    print(f"ABORTING RUN: {error}")
    sys.exit(1)