import os
from config import CAREER_START_DATE
from db import (
    clear_failed_player,
    get_award_type_uuid,
    get_client,
    get_failed_player_ids,
    get_player_uuid,
    get_team_uuid,
    record_failed_player,
    upsert_player,
    upsert_team_tenure,
)
from mlb_client import (
    MlbApiError,
    breaker,
    get_all_awards,
    get_career_stats,
    get_player_bio,
    mlb_get,
)
from transform import (
    aggregate_fielding_games,
    build_hometown,
    build_image_url,
    compute_eligible_positions,
    compute_is_qualified_batter,
    compute_is_qualified_pitcher,
    extract_side,
    resolve_batting_level,
    resolve_pitching_level,
    select_all_split,
    to_number,
)


def write_run_summary(existing_ids: set[str], season: int) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return

    try:
        failed_count = len(get_failed_player_ids())
    except Exception as error:
        print(f"  Could not fetch failed-player count for summary: {error}")
        failed_count = "unknown"

    with open(summary_path, "a") as f:
        f.write("## Run summary\n")
        f.write(f"- Total players in database: {len(existing_ids)}\n")
        f.write(f"- Currently failed/pending retry: {failed_count}\n")
        f.write(f"- Season marker after this run: {season}\n")


def build_player_record(
    player_id: int, levels: list[dict], end_date: str
) -> dict | None:
    bio = get_player_bio(player_id)
    if not bio:
        return None

    hitting = (
        select_all_split(
            get_career_stats(player_id, "hitting", CAREER_START_DATE, end_date)
        )
        or {}
    )
    pitching = (
        select_all_split(
            get_career_stats(player_id, "pitching", CAREER_START_DATE, end_date)
        )
        or {}
    )
    fielding_splits = get_career_stats(
        player_id, "fielding", CAREER_START_DATE, end_date
    )

    hitting_stat = hitting.get("stat", {})
    pitching_stat = pitching.get("stat", {})
    mlb_career_avg = to_number(hitting_stat.get("avg"))
    mlb_career_era = to_number(pitching_stat.get("era"))

    if mlb_career_avg is None and mlb_career_era is None:
        return None

    mlb_career_pa = hitting_stat.get("plateAppearances")
    mlb_career_ip_raw = pitching_stat.get("inningsPitched")

    qualified_batter = compute_is_qualified_batter(mlb_career_pa)
    qualified_pitcher = compute_is_qualified_pitcher(mlb_career_ip_raw)
    eligible_positions = compute_eligible_positions(
        aggregate_fielding_games(fielding_splits), qualified_pitcher
    )

    return {
        "external_id": str(player_id),
        "name": bio.get("fullName"),
        "nickname": bio.get("nickName"),
        "hometown": build_hometown(bio),
        "birthday": bio.get("birthDate"),
        "active": bio.get("active"),
        "mlb_debut_date": bio.get("mlbDebutDate"),
        "eligible_positions": eligible_positions,
        "bats": extract_side(bio.get("batSide")),
        "throws": extract_side(bio.get("pitchHand")),
        "mlb_career_avg": mlb_career_avg,
        "mlb_career_era": mlb_career_era,
        "mlb_career_pa": mlb_career_pa,
        "mlb_career_at_bats": hitting_stat.get("atBats"),
        "mlb_career_runs": hitting_stat.get("runs"),
        "mlb_career_hits": hitting_stat.get("hits"),
        "mlb_career_rbi": hitting_stat.get("rbi"),
        "mlb_career_sb": hitting_stat.get("stolenBases"),
        "mlb_career_obp": to_number(hitting_stat.get("obp")),
        "mlb_career_ops": to_number(hitting_stat.get("ops")),
        "mlb_career_wins": pitching_stat.get("wins"),
        "mlb_career_losses": pitching_stat.get("losses"),
        "mlb_career_saves": pitching_stat.get("saves"),
        "mlb_career_innings_pitched": to_number(mlb_career_ip_raw),
        "mlb_career_strikeouts": pitching_stat.get("strikeOuts"),
        "mlb_career_whip": to_number(pitching_stat.get("whip")),
        "batting_rating_level": resolve_batting_level(mlb_career_avg, levels),
        "pitching_rating_level": resolve_pitching_level(mlb_career_era, levels),
        "is_qualified_batter": qualified_batter,
        "is_qualified_pitcher": qualified_pitcher,
        "image_url": build_image_url(player_id),
    }


def record_player_team_history(
    external_id: int,
    season_start_date_month: str = "03-01",
    season_end_date_month: str = "11-01",
) -> None:
    player_uuid = get_player_uuid(str(external_id))
    if not player_uuid:
        return

    seen_team_seasons = set()

    for group in ("hitting", "pitching"):
        try:
            data = mlb_get(
                f"/people/{external_id}/stats", {"stats": "yearByYear", "group": group}
            )
        except MlbApiError as error:
            print(f"    SKIPPED team history ({group}) for {external_id}: {error}")
            continue

        stats = data.get("stats", [])
        splits = stats[0].get("splits", []) if stats else []

        for split in splits:
            team = split.get("team")
            season = split.get("season")
            if not team or not season:
                continue

            key = (team["id"], season)
            if key in seen_team_seasons:
                continue
            seen_team_seasons.add(key)

            team_uuid = get_team_uuid(str(team["id"]))
            if not team_uuid:
                continue

            upsert_team_tenure(
                player_uuid,
                team_uuid,
                f"{season}-{season_start_date_month}",
                f"{season}-{season_end_date_month}",
            )


def process_roster(
    roster: list[dict],
    levels: list[dict],
    existing_ids: set[str],
    end_date: str,
    skip_existing: bool,
) -> None:
    for entry in roster:
        player_id, name = entry["person"]["id"], entry["person"]["fullName"]
        player_id_str = str(player_id)

        if skip_existing and player_id_str in existing_ids:
            continue

        try:
            record = build_player_record(player_id, levels, end_date)
        except MlbApiError as error:
            print(f"  SKIPPED {name} ({player_id}): {error}")
            record_failed_player(player_id_str, str(error))
            breaker.record_failure()
            breaker.trip_if_needed()
            continue

        if record is None:
            breaker.record_success()
            continue

        try:
            upsert_player(record)
        except Exception as error:
            print(f"  SKIPPED {name} ({player_id}): write failed -- {error}")
            record_failed_player(player_id_str, str(error))
            continue

        record_player_team_history(player_id)
        clear_failed_player(player_id_str)
        existing_ids.add(player_id_str)
        breaker.record_success()
        print(
            f"  UPSERTED {name}: batter={record['is_qualified_batter']}, pitcher={record['is_qualified_pitcher']}, positions={record['eligible_positions']}"
        )


def seed_player_awards() -> None:
    print("--- Seeding player awards ---")
    for award in get_all_awards():
        award_type_id = get_award_type_uuid(award["id"])
        if not award_type_id:
            continue

        try:
            data = mlb_get(f"/awards/{award['id']}/recipients")
        except MlbApiError as error:
            print(f"  SKIPPED award {award['id']}: {error}")
            continue

        for recipient in data.get("awards", []):
            player_id = get_player_uuid(str(recipient["player"]["id"]))
            if not player_id:
                continue  # not in our qualified pool -- expected, not an error

            row = {
                "player_id": player_id,
                "award_type_id": award_type_id,
                "season": int(recipient["season"]),
            }
            get_client().table("player_awards").upsert(
                row, on_conflict="player_id,award_type_id,season"
            ).execute()

    print("Player awards seeding complete.")
