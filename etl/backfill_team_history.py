import os
import sys
from db import get_player_ids_missing_team_history
from mlb_client import CircuitBreakerAbort
from pipeline import record_player_team_history


def write_backfill_summary(processed: int, remaining: int) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return

    with open(summary_path, "a") as f:
        f.write("## Team history backfill summary\n")
        f.write(f"- Players processed this run: {processed}\n")
        f.write(f"- Players still missing team history: {remaining}\n")


def run_backfill() -> None:
    missing_ids = get_player_ids_missing_team_history()
    total = len(missing_ids)
    print(f"Backfilling team history for {total} players missing it")

    processed = 0
    try:
        for external_id in missing_ids:
            record_player_team_history(int(external_id))
            processed += 1
            if processed % 25 == 0:
                print(f"  ...{processed}/{total} done")

        print("Backfill complete.")
    finally:
        remaining = len(get_player_ids_missing_team_history())
        write_backfill_summary(processed, remaining)


if __name__ == "__main__":
    try:
        run_backfill()
    except CircuitBreakerAbort as error:
        print(f"ABORTING RUN: {error}")
        sys.exit(1)
