from mlb_client import get_all_teams, get_all_awards
from db import seed_mlb_teams, seed_award_types

def seed_reference_data() -> None:
  teams = get_all_teams()
  print(f"Fetched {len(teams)} teams")
  seed_mlb_teams(teams)
  print("Seeded mlb_teams")

  awards = get_all_awards()
  print(f"Fetched {len(awards)} awards")
  seed_award_types(awards)
  print("Seeded award_types")


if __name__ == "__main__":
  seed_reference_data()