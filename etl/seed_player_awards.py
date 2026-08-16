import time

from config import AWARDS_SEED_MAX_RUNTIME_SECONDS, BOOTSTRAP_START_SEASON, ERA_FLOOR_SEASON
from db import get_award_types, get_client, get_config_value, get_player_uuid, set_config
from mlb_client import MlbApiError, mlb_get

AWARD_EVALUATION_SEASON_CONFIG_KEY = "award_evaluation_current_season"
AWARD_EVALUATION_AWARD_ID_CONFIG_KEY = "award_evaluation_current_award_id"


def seed_player_awards() -> None:
    print("--- Seeding player awards ---")
    start_time = time.monotonic()

    award_types = get_award_types()
    external_ids = [award_type["external_id"] for award_type in award_types]

    stored_season = get_config_value(AWARD_EVALUATION_SEASON_CONFIG_KEY)
    stored_award_id = get_config_value(AWARD_EVALUATION_AWARD_ID_CONFIG_KEY)

    if stored_season is None:
        start_season = BOOTSTRAP_START_SEASON
        start_award_index = 0
    else:
        start_season = int(stored_season)
        if stored_award_id:
            try:
                start_award_index = external_ids.index(stored_award_id) + 1
            except ValueError:
                start_award_index = 0
        else:
            start_award_index = 0

    season = start_season
    award_index = start_award_index

    while season >= ERA_FLOOR_SEASON:
        print(f"--- Season {season} ---")
        set_config(AWARD_EVALUATION_SEASON_CONFIG_KEY, str(season))

        for award_type in award_types[award_index:]:
            if time.monotonic() - start_time > AWARDS_SEED_MAX_RUNTIME_SECONDS:
                print(
                    f"Runtime budget reached, stopping at season {season}, "
                    f"award {award_type['external_id']}."
                )
                return

            award_type_id = award_type["id"]
            external_id = award_type["external_id"]

            try:
                data = mlb_get(f"/awards/{external_id}/recipients", {"season": season})
            except MlbApiError as error:
                print(f"  SKIPPED award {external_id} season {season}: {error}")
                set_config(AWARD_EVALUATION_AWARD_ID_CONFIG_KEY, external_id)
                continue

            recipients = data.get("awards", [])

            for recipient in recipients:
                recipient_id = recipient["player"]["id"]

                try:
                    player_id = get_player_uuid(str(recipient_id))
                except Exception as error:
                    print(f"    SKIPPED recipient {recipient_id}: lookup failed -- {error}")
                    continue

                if not player_id:
                    continue

                try:
                    row = {
                        "player_id": player_id,
                        "award_type_id": award_type_id,
                        "season": int(recipient["season"]),
                    }
                    get_client().table("player_awards").upsert(
                        row, on_conflict="player_id,award_type_id,season"
                    ).execute()
                except Exception as error:
                    print(f"    SKIPPED recipient {recipient_id}: write failed -- {error}")
                    continue

            set_config(AWARD_EVALUATION_AWARD_ID_CONFIG_KEY, external_id)

        set_config(AWARD_EVALUATION_AWARD_ID_CONFIG_KEY, "")
        season -= 1
        award_index = 0

    print("Player awards seeding complete -- reached floor season.")