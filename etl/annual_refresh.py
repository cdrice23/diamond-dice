import json
import sys

from datetime import datetime, timezone

from config import TEAM_BATCH_SIZE
from mlb_client import get_all_team_ids, get_historical_roster, get_all_teams, get_all_awards, CircuitBreakerAbort
from db import get_levels, get_existing_external_ids, get_config_value, set_config, seed_mlb_teams, seed_award_types
from pipeline import process_roster, seed_player_awards, write_run_summary


def get_refresh_end_date(season: int) -> str:
  return f"{season}-11-01"

def get_target_season_for_refresh() -> int | None:
  now = datetime.now(timezone.utc)
  season_end_cutoff = datetime(now.year, 11, 1, tzinfo=timezone.utc)
  if now < season_end_cutoff:
    return None
  return now.year

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