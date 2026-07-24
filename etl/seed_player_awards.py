from db import get_award_type_uuid, get_client, get_player_uuid
from mlb_client import MlbApiError, get_all_awards, mlb_get


def seed_player_awards() -> None:
    print("--- Seeding player awards ---")
    for award in get_all_awards():
        try:
            award_type_id = get_award_type_uuid(award["id"])
        except Exception as error:
            print(
                f"  SKIPPED award {award['id']}: could not resolve award_type -- {error}"
            )
            continue

        if not award_type_id:
            continue

        try:
            data = mlb_get(f"/awards/{award['id']}/recipients")
        except MlbApiError as error:
            print(f"  SKIPPED award {award['id']}: {error}")
            continue

        for recipient in data.get("awards", []):
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

    print("Player awards seeding complete.")
