from config import ERA_FLOOR_SEASON, MAJOR_AWARD_EXTERNAL_IDS
from db import get_award_types, get_client, get_player_uuid
from mlb_client import MlbApiError, mlb_get


def refresh_player_awards() -> None:
    print("--- Refreshing player awards ---")

    award_types = get_award_types()
    major_award_types = [
        award_type
        for award_type in award_types
        if award_type["external_id"] in MAJOR_AWARD_EXTERNAL_IDS
    ]

    found_external_ids = {a["external_id"] for a in major_award_types}
    missing = MAJOR_AWARD_EXTERNAL_IDS - found_external_ids
    if missing:
        print(f"  WARNING: not found in award_types table: {sorted(missing)}")

    for award_type in major_award_types:
        award_type_id = award_type["id"]
        external_id = award_type["external_id"]

        try:
            data = mlb_get(f"/awards/{external_id}/recipients")
        except MlbApiError as error:
            print(f"  SKIPPED award {external_id}: {error}")
            continue

        for recipient in data.get("awards", []):
            recipient_id = recipient["player"]["id"]

            try:
                season = int(recipient["season"])
            except (KeyError, ValueError):
                continue

            if season < ERA_FLOOR_SEASON:
                continue

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
                    "season": season,
                }
                get_client().table("player_awards").upsert(
                    row, on_conflict="player_id,award_type_id,season"
                ).execute()
            except Exception as error:
                print(f"    SKIPPED recipient {recipient_id}: write failed -- {error}")
                continue

    print("Player awards refresh complete.")


if __name__ == "__main__":
    refresh_player_awards()