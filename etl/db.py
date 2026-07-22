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