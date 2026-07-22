from mlb_client import get_all_team_ids, get_historical_roster
from db import get_levels, get_existing_external_ids, get_last_processed_season, set_last_processed_season
from pipeline import process_roster
from config import BOOTSTRAP_START_SEASON, ERA_FLOOR_SEASON, SEASON_BATCH_SIZE, BOOTSTRAP_END_DATE


def run_bootstrap_batch() -> None:
  levels = get_levels()
  existing_ids = get_existing_external_ids()
  team_ids = get_all_team_ids()
  current_season = get_last_processed_season(default=BOOTSTRAP_START_SEASON)

  if current_season < ERA_FLOOR_SEASON:
    print("Bootstrap crawl complete -- reached era floor.")
    return

  target_floor = max(current_season - SEASON_BATCH_SIZE + 1, ERA_FLOOR_SEASON)

  for season in range(current_season, target_floor - 1, -1):
    print(f"--- Season {season} ---")
    for team_id in team_ids:
      roster = get_historical_roster(team_id, season)
      process_roster(roster, levels, existing_ids, end_date=BOOTSTRAP_END_DATE, skip_existing=True)

  set_last_processed_season(target_floor - 1)
  print(f"Batch complete. Next run resumes at season {target_floor - 1}.")


if __name__ == "__main__":
  run_bootstrap_batch()