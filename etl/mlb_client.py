# NOTE: No official limits are published for this API, and connection-level
# failures (RemoteDisconnected) are a confirmed, real occurrence -- not
# hypothetical. Every request goes through here so that behavior is handled
# in exactly one place.

import time
import requests

from config import BASE_URL, MAX_RETRIES, RETRY_BACKOFF_SECONDS, REQUEST_PACING_SECONDS


class MlbApiError(Exception):
  """Raised when a request fails after all retries are exhausted."""


def mlb_get(path: str, params: dict | None = None) -> dict:
  url = f"{BASE_URL}{path}"
  last_error: Exception | None = None

  for attempt in range(1, MAX_RETRIES + 1):
      try:
          response = requests.get(url, params=params or {}, timeout=30)
          response.raise_for_status()
          time.sleep(REQUEST_PACING_SECONDS)
          return response.json()
      except requests.exceptions.RequestException as error:
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