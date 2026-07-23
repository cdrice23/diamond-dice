from config import BOOTSTRAP_END_DATE
from db import get_existing_external_ids, get_levels
from mlb_client import get_team_roster
from pipeline import process_roster

if __name__ == "__main__":
    levels = get_levels()
    existing_ids = get_existing_external_ids()
    roster = get_team_roster(119)
    process_roster(roster, levels, existing_ids, end_date=BOOTSTRAP_END_DATE, skip_existing=True)
