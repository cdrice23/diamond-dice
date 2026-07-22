from config import (
  OUTFIELD_POSITION_ABBREVIATIONS, TRACKED_FIELDING_POSITIONS,
  PA_QUALIFICATION_THRESHOLD, IP_QUALIFICATION_THRESHOLD, POSITION_ELIGIBILITY_GAMES_THRESHOLD,
)

def select_all_split(splits: list[dict]) -> dict | None:
  for split in splits:
    if split.get("sport", {}).get("code") == "All":
      return split
  return splits[0] if splits else None  # single-team players have no separate 'All' entry

# Rate stats are JSON strings, not numbers. '.---'/'-.--' are undefined (0/0) placeholders
def to_number(value):
  if value is None:
    return None
  if isinstance(value, (int, float)):
    return value
  stripped = str(value).strip()
  if stripped in (".---", "-.--", "---", ""):
    return None
  try:
    return float(stripped)
  except ValueError:
    return None

# batSide/pitchHand are {'code': 'R', ...} objects, not plain strings
def extract_side(side_obj: dict | None) -> str | None:
  if not side_obj:
    return None
  return {"L": "left", "R": "right", "S": "both"}.get(side_obj.get("code"))

# birthStateProvince absent for international players
def build_hometown(bio: dict) -> str | None:
  parts = [bio.get("birthCity")]
  if bio.get("birthStateProvince"):
    parts.append(bio["birthStateProvince"])
  if bio.get("birthCountry"):
    parts.append(bio["birthCountry"])
  return ", ".join(p for p in parts if p) or None

# Constructed, not fetched -- no JSON field for this
def build_image_url(player_id: int) -> str:
  return (
    "https://img.mlbstatic.com/mlb-photos/image/upload/"
    "w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/"
    f"v1/people/{player_id}/headshot/67/current"
  )

# Sum career games per position from each position's own 'All' split - LF/CF/RF fold into one OF bucket
def aggregate_fielding_games(fielding_splits: list[dict]) -> dict[str, int]:
  games_by_position: dict[str, int] = {}
  for split in fielding_splits:
    if split.get("sport", {}).get("code") != "All":
      continue
    position = split.get("stat", {}).get("position", {})
    abbreviation = position.get("abbreviation")
    games = split.get("stat", {}).get("gamesPlayed", 0)

    if abbreviation in OUTFIELD_POSITION_ABBREVIATIONS:
      bucket = "OF"
    elif abbreviation in TRACKED_FIELDING_POSITIONS:
      bucket = abbreviation
    else:
      continue  # DH, P handled elsewhere -- not part of this aggregation

    games_by_position[bucket] = games_by_position.get(bucket, 0) + games
  return games_by_position

# DH is deliberately never included -- business logic, not per-player data
def compute_eligible_positions(games_by_position: dict[str, int], qualified_pitcher: bool) -> list[str]:
  positions = [p for p, g in games_by_position.items() if g >= POSITION_ELIGIBILITY_GAMES_THRESHOLD]
  if qualified_pitcher:
    positions.append("P")
  return positions

def compute_is_qualified_batter(plate_appearances) -> bool:
  return (plate_appearances or 0) >= PA_QUALIFICATION_THRESHOLD

# Traditional .1/.2 notation needs real decimal conversion FOR THIS COMPARISON ONLY 
# Stored mlb_career_innings_pitched column keeps traditional notation
def compute_is_qualified_pitcher(innings_pitched_raw) -> bool:
  if not innings_pitched_raw:
    return False
  whole_str, _, frac_str = str(innings_pitched_raw).partition(".")
  thirds = int(frac_str) if frac_str else 0
  return int(whole_str) + (thirds / 3) >= IP_QUALIFICATION_THRESHOLD

def resolve_batting_level(avg: float | None, levels: list[dict]) -> int | None:
  if avg is None:
    return None
  for lvl in levels:
    if lvl["min_avg"] <= avg <= lvl["max_avg"]:
      return lvl["level"]
  return None

def resolve_pitching_level(era: float | None, levels: list[dict]) -> int | None:
  if era is None:
    return None
  for lvl in levels:
    if lvl["max_era"] is None:  # Level 1 -- no real upper bound
      if era >= lvl["min_era"]:
        return lvl["level"]
    elif lvl["min_era"] <= era <= lvl["max_era"]:
      return lvl["level"]
  return None