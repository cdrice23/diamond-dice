# NOTE: No official limits are published for this API, and connection-level
# failures (RemoteDisconnected) are a confirmed, real occurrence -- not
# hypothetical. Every request goes through here so that behavior is handled
# in exactly one place.

import time
import requests

from config import (
  BASE_URL, MAX_RETRIES, RETRY_BACKOFF_SECONDS, REQUEST_PACING_SECONDS, REQUEST_TIMEOUT_SECONDS,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD, CIRCUIT_BREAKER_COOLDOWN_SECONDS, CIRCUIT_BREAKER_MAX_TRIPS_PER_RUN
)

HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

class MlbApiError(Exception):
  """Raised when a request fails after all retries are exhausted."""

class CircuitBreakerAbort(Exception):
  """Signals the whole run should exit -- built to handle likely silent throttling on the server 
  side during GitHub Actions scheduled jobs.
  """

class CircuitBreaker:
  def __init__(self) -> None:
    self.consecutive_failures = 0
    self.trip_count = 0

  def record_success(self) -> None:
    self.consecutive_failures = 0

  def record_failure(self) -> None:
    self.consecutive_failures += 1

  def trip_if_needed(self) -> None:
    if self.consecutive_failures < CIRCUIT_BREAKER_FAILURE_THRESHOLD:
      return

    self.trip_count += 1
    self.consecutive_failures = 0

    if self.trip_count >= CIRCUIT_BREAKER_MAX_TRIPS_PER_RUN:
      raise CircuitBreakerAbort(
        f"Tripped {self.trip_count} times this run -- API appears to be in a "
        f"sustained bad state. Exiting; the next scheduled run will retry."
      )

    print(f"CIRCUIT BREAKER TRIPPED ({self.trip_count}/{CIRCUIT_BREAKER_MAX_TRIPS_PER_RUN}) -- "
          f"cooling down for {CIRCUIT_BREAKER_COOLDOWN_SECONDS}s.")
    time.sleep(CIRCUIT_BREAKER_COOLDOWN_SECONDS)

def mlb_get(path: str, params: dict | None = None) -> dict:
  url = f"{BASE_URL}{path}"
  last_error: Exception | None = None

  for attempt in range(1, MAX_RETRIES + 1):
    start = time.monotonic()
    try:
      response = requests.get(url, params=params or {}, headers=HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
      response.raise_for_status()
      elapsed = time.monotonic() - start
      if elapsed > 5:
        print(f"    SLOW REQUEST ({elapsed:.1f}s): {path}")
      time.sleep(REQUEST_PACING_SECONDS)
      return response.json()
    except requests.exceptions.RequestException as error:
      elapsed = time.monotonic() - start
      print(f"    FAILED ATTEMPT {attempt} ({elapsed:.1f}s): {path} -- {error}")
      last_error = error
      if attempt < MAX_RETRIES:
        time.sleep(RETRY_BACKOFF_SECONDS * attempt)

  raise MlbApiError(f"Failed to fetch {url} after {MAX_RETRIES} attempts: {last_error}")

# Un-hydrated roster call
def get_team_roster(team_id: int) -> list[dict]:
  return mlb_get(f"/teams/{team_id}/roster").get("roster", [])


def get_player_bio(player_id: int) -> dict:
  people = mlb_get(f"/people/{player_id}").get("people", [])
  return people[0] if people else {}

# Bounded byDateRange and filtered by regular season games (gameType=R)
def get_career_stats(player_id: int, group: str, start_date: str, end_date: str) -> list[dict]:
  data = mlb_get(
      f"/people/{player_id}/stats",
      {"stats": "byDateRange", "group": group, "startDate": start_date, "endDate": end_date, "gameType": "R"},
  )
  stats = data.get("stats", [])
  return stats[0].get("splits", []) if stats else []

def get_all_team_ids() -> list[int]:
  data = mlb_get("/teams", {"sportId": 1})
  return [team["id"] for team in data.get("teams", [])]

def get_all_teams() -> list[dict]:
  data = mlb_get("/teams", {"sportId": 1})
  return data.get("teams", [])

def get_all_awards() -> list[dict]:
  data = mlb_get("/awards", {"sportId": 1})
  return data.get("awards", [])

def get_historical_roster(team_id: int, season: int) -> list[dict]:
  data = mlb_get(f"/teams/{team_id}/roster", {"rosterType": "fullSeason", "season": str(season)})
  return data.get("roster", [])