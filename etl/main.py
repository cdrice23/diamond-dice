from mlb_client import get_all_team_ids, get_team_roster, get_player_bio, get_career_stats, MlbApiError
from transform import (
  select_all_split, to_number, extract_side, build_hometown, build_image_url,
  aggregate_fielding_games, compute_eligible_positions,
  compute_is_qualified_batter, compute_is_qualified_pitcher,
  resolve_batting_level, resolve_pitching_level
)
from config import BOOTSTRAP_START_DATE, BOOTSTRAP_END_DATE
from db import get_existing_external_ids, get_levels, upsert_player


def build_player_record(player_id: int, levels: list[dict]) -> dict | None:
  bio = get_player_bio(player_id)
  if not bio:
    return None

  hitting = select_all_split(get_career_stats(player_id, "hitting", BOOTSTRAP_START_DATE, BOOTSTRAP_END_DATE)) or {}
  pitching = select_all_split(get_career_stats(player_id, "pitching", BOOTSTRAP_START_DATE, BOOTSTRAP_END_DATE)) or {}
  fielding_splits = get_career_stats(player_id, "fielding", BOOTSTRAP_START_DATE, BOOTSTRAP_END_DATE)

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
  eligible_positions = compute_eligible_positions(aggregate_fielding_games(fielding_splits), qualified_pitcher)

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

def process_team(team_id: int, levels: list[dict], existing_ids: set[str] | None = None) -> None:
  roster = get_team_roster(team_id)
  print(f"Found {len(roster)} players on roster {team_id}")

  for entry in roster:
    player_id, name = entry["person"]["id"], entry["person"]["fullName"]
    player_id_str = str(player_id)

    if existing_ids is not None and player_id_str in existing_ids:
      print(f"  SKIPPED {name} ({player_id}): already seeded")
      continue

    try:
      record = build_player_record(player_id, levels)
    except MlbApiError as error:
      print(f"  SKIPPED {name} ({player_id}): {error}")
      continue

    if record is None:
      print(f"  SKIPPED {name} ({player_id}): no bio data or no MLB record before cutoff")
      continue

    upsert_player(record)
    print(f"  UPSERTED {name}: batter={record['is_qualified_batter']}, pitcher={record['is_qualified_pitcher']}, "
      f"positions={record['eligible_positions']}, batting_level={record['batting_rating_level']}, "
      f"pitching_level={record['pitching_rating_level']}")


# if __name__ == "__main__":
#   levels = get_levels()
#   existing_ids = get_existing_external_ids()
#   process_team(119, levels)

if __name__ == "__main__":
  team_ids = get_all_team_ids()
  print(f"Found {len(team_ids)} teams: {team_ids}")