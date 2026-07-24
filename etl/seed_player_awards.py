from db import seed_award_types
from mlb_client import get_all_awards
from pipeline import seed_player_awards


def run() -> None:
    seed_award_types(get_all_awards())
    seed_player_awards()
    print("Player awards seeding run complete.")


if __name__ == "__main__":
    run()
