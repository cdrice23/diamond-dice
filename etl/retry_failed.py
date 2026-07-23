from config import BOOTSTRAP_END_DATE
from db import (
    clear_failed_player,
    get_failed_player_ids,
    get_levels,
    record_failed_player,
    upsert_player,
)
from mlb_client import MlbApiError
from pipeline import build_player_record


def retry_failed_players() -> None:
    levels = get_levels()
    failed_ids = get_failed_player_ids()
    print(f"Retrying {len(failed_ids)} previously failed players")

    for player_id_str in failed_ids:
        try:
            record = build_player_record(int(player_id_str), levels, BOOTSTRAP_END_DATE)
        except MlbApiError as error:
            print(f"  STILL FAILING {player_id_str}: {error}")
            record_failed_player(player_id_str, str(error))
            continue

        if record is None:
            clear_failed_player(player_id_str)
            continue

        upsert_player(record)
        clear_failed_player(player_id_str)
        print(f"  RECOVERED {record['name']}")


if __name__ == "__main__":
    retry_failed_players()
