BASE_URL = "https://statsapi.mlb.com/api/v1"

# Qualification thresholds -- all three mirror the "one season equivalent" convention
PA_QUALIFICATION_THRESHOLD = 502
IP_QUALIFICATION_THRESHOLD = 162.0
POSITION_ELIGIBILITY_GAMES_THRESHOLD = 162

# Bootstrap season cutoff for initial seed data -- "career as of end of 2025 season"
BOOTSTRAP_START_DATE = "1900-01-01"
BOOTSTRAP_END_DATE = "2025-11-01"

# The fielding endpoint reports OF positions separately; the schema tracks one combined OF bucket
OUTFIELD_POSITION_ABBREVIATIONS = {"LF", "CF", "RF"}
TRACKED_FIELDING_POSITIONS = {"C", "1B", "2B", "3B", "SS", "OF"}

REQUEST_PACING_SECONDS = 0.5
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 2