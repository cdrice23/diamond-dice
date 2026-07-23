import json
import sys
import os

from config import BOOTSTRAP_START_SEASON, ERA_FLOOR_SEASON, TEAM_BATCH_SIZE, BOOTSTRAP_END_DATE
from mlb_client import get_all_team_ids, get_historical_roster, CircuitBreakerAbort
from db import get_failed_player_ids, get_levels, get_existing_external_ids, get_config_value, set_config
from pipeline import process_roster


def run_bootstrap_batch() -> None:
  levels = get_levels()
  existing_ids = get_existing_external_ids()
  team_ids = sorted(get_all_team_ids())

  season = int(get_config_value("etl_current_season", default=str(BOOTSTRAP_START_SEASON)))
  completed_teams = set(json.loads(get_config_value("etl_completed_teams_this_season", default="[]")))

  try:
    if season < ERA_FLOOR_SEASON:
      print("Bootstrap crawl complete -- reached era floor.")
      return

    pairs_processed = 0
    while pairs_processed < TEAM_BATCH_SIZE and season >= ERA_FLOOR_SEASON:
      remaining_teams = [t for t in team_ids if str(t) not in completed_teams]

      if not remaining_teams:
        season -= 1
        completed_teams = set()
        set_config("etl_current_season", str(season))
        set_config("etl_completed_teams_this_season", json.dumps([]))
        if season < ERA_FLOOR_SEASON:
          break
        continue

      team_id = remaining_teams[0]
      print(f"--- Season {season}, team {team_id} ({len(completed_teams) + 1}/{len(team_ids)}) ---")
      roster = get_historical_roster(team_id, season)
      process_roster(roster, levels, existing_ids, end_date=BOOTSTRAP_END_DATE, skip_existing=True)

      completed_teams.add(str(team_id))
      set_config("etl_completed_teams_this_season", json.dumps(sorted(completed_teams)))
      pairs_processed += 1

    print(f"Batch complete. Currently at season {season}, {len(completed_teams)}/{len(team_ids)} teams done.")
  finally:
    write_run_summary(existing_ids, season)

def write_run_summary(existing_ids: set[str], season: int) -> None:
  summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
  if not summary_path:
    return

  failed_count = len(get_failed_player_ids())
  with open(summary_path, "a") as f:
    f.write(f"## Bootstrap run summary\n")
    f.write(f"- Total players in database: {len(existing_ids)}\n")
    f.write(f"- Currently failed/pending retry: {failed_count}\n")
    f.write(f"- Season marker after this run: {season}\n")

if __name__ == "__main__":
  try:
    run_bootstrap_batch()
  except CircuitBreakerAbort as error:
    print(f"ABORTING RUN: {error}")
    sys.exit(1)