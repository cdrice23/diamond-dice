from mlb_client import get_team_roster
from db import get_levels, get_existing_external_ids
from pipeline import process_roster
from config import BOOTSTRAP_END_DATE


if __name__ == "__main__":
  levels = get_levels()
  existing_ids = get_existing_external_ids()
  roster = get_team_roster(119)
  process_roster(roster, levels, existing_ids, end_date=BOOTSTRAP_END_DATE, skip_existing=True)