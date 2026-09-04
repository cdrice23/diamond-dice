import json
import sys
import time
from datetime import datetime, timezone
from config import REFRESH_MAX_TEAM_PAIRS_PER_RUN, REFRESH_TIME_BUDGET_SECONDS
from db import (
    get_config_value,
    get_existing_external_ids,
    get_levels,
    seed_award_types,
    seed_mlb_teams,
    set_config,
)
from mlb_client import (
    CircuitBreakerAbort,
    get_all_awards,
    get_all_team_ids,
    get_all_teams,
    get_historical_roster,
)
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
    start_time = time.monotonic()
    seed_mlb_teams(get_all_teams())
    seed_award_types(get_all_awards())

    expected_season = get_target_season_for_refresh()
    if expected_season is None:
        print("Current season has not concluded yet -- nothing to refresh.")
        return

    levels = get_levels()
    existing_ids = get_existing_external_ids()
    team_ids = sorted(get_all_team_ids())

    stored_season = int(
        get_config_value("etl_refresh_target_season", default=str(expected_season))
    )

    if stored_season < expected_season:
        stored_season = expected_season
        set_config("etl_refresh_target_season", str(stored_season))
        set_config("etl_refresh_completed_teams", json.dumps([]))
        set_config("etl_refresh_awards_seeded", "false")

    completed_teams = set(
        json.loads(get_config_value("etl_refresh_completed_teams", default="[]"))
    )
    remaining_teams = [t for t in team_ids if str(t) not in completed_teams]

    if not remaining_teams:
        seed_player_awards()
        print(f"Annual refresh for season {stored_season} already complete.")
        return

    end_date = get_refresh_end_date(stored_season)

    try:
        pairs_processed = 0
        while (
            remaining_teams
            and time.monotonic() - start_time < REFRESH_TIME_BUDGET_SECONDS
            and pairs_processed < REFRESH_MAX_TEAM_PAIRS_PER_RUN
        ):
            team_id = remaining_teams.pop(0)
            print(f"--- Refresh season {stored_season}, team {team_id} ---")
            roster = get_historical_roster(team_id, stored_season)
            process_roster(
                roster, levels, existing_ids, end_date=end_date, skip_existing=False
            )
            completed_teams.add(str(team_id))
            set_config(
                "etl_refresh_completed_teams", json.dumps(sorted(completed_teams))
            )
            pairs_processed += 1

        elapsed_minutes = (time.monotonic() - start_time) / 60
        if len(completed_teams) >= len(team_ids):
            print(
                f"Annual refresh for season {stored_season} complete after {elapsed_minutes:.1f}m."
            )
        else:
            print(
                f"Batch complete after {elapsed_minutes:.1f}m ({pairs_processed} team-pairs). "
                f"{len(completed_teams)}/{len(team_ids)} teams done for season {stored_season}."
            )
    finally:
        write_run_summary(existing_ids, stored_season)


if __name__ == "__main__":
    try:
        run_annual_refresh_batch()
    except CircuitBreakerAbort as error:
        print(f"ABORTING RUN: {error}")
        sys.exit(1)
