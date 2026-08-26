import math
import statistics
from datetime import datetime, timezone
from db import get_client, upsert_stat_distribution

PAGE_SIZE = 1000
BUCKET_COUNT = 40

EMPIRICAL_STATS = [
    {
        "key": "avg",
        "column": "mlb_career_avg",
        "qualified_column": "is_qualified_batter",
    },
    {
        "key": "obp",
        "column": "mlb_career_obp",
        "qualified_column": "is_qualified_batter",
    },
    {
        "key": "ops",
        "column": "mlb_career_ops",
        "qualified_column": "is_qualified_batter",
    },
]

EMPIRICAL_RATE_STATS = [
    {
        "key": "sb_rate",
        "numerator": "mlb_career_sb",
        "denominator": "mlb_career_pa",
        "per": 650,
        "qualified_column": "is_qualified_batter",
    },
]

PARAMETRIC_STATS = [
    {
        "key": "era",
        "column": "mlb_career_era",
        "qualified_column": "is_qualified_pitcher",
    },
    {
        "key": "whip",
        "column": "mlb_career_whip",
        "qualified_column": "is_qualified_pitcher",
    },
]

PARAMETRIC_RATE_STATS = [
    {
        "key": "k_per_9",
        "numerator": "mlb_career_strikeouts",
        "denominator": "mlb_career_innings_pitched",
        "per": 9,
        "qualified_column": "is_qualified_pitcher",
    },
    {
        "key": "rbi_rate",
        "numerator": "mlb_career_rbi",
        "denominator": "mlb_career_pa",
        "per": 650,
        "qualified_column": "is_qualified_batter",
    },
    {
        "key": "run_rate",
        "numerator": "mlb_career_runs",
        "denominator": "mlb_career_pa",
        "per": 650,
        "qualified_column": "is_qualified_batter",
    },
]


def fetch_column_values(column: str, qualified_column: str) -> list[float]:
    values = []
    start = 0
    while True:
        end = start + PAGE_SIZE - 1
        result = (
            get_client()
            .table("players")
            .select(column)
            .eq(qualified_column, True)
            .not_.is_(column, "null")
            .range(start, end)
            .execute()
        )
        rows = result.data
        if not rows:
            break
        values.extend(row[column] for row in rows if row[column] is not None)
        if len(rows) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return values


def fetch_rate_values(
    numerator: str, denominator: str, per: float, qualified_column: str
) -> list[float]:
    values = []
    start = 0
    while True:
        end = start + PAGE_SIZE - 1
        result = (
            get_client()
            .table("players")
            .select(f"{numerator},{denominator}")
            .eq(qualified_column, True)
            .not_.is_(numerator, "null")
            .not_.is_(denominator, "null")
            .gt(denominator, 0)
            .range(start, end)
            .execute()
        )
        rows = result.data
        if not rows:
            break
        for row in rows:
            num, denom = row[numerator], row[denominator]
            if num is not None and denom:
                values.append((num / denom) * per)
        if len(rows) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return values


def percentile(sorted_values: list[float], p: float) -> float:
    # Linear interpolation, matching Postgres's percentile_cont exactly.
    idx = p * (len(sorted_values) - 1)
    lower = math.floor(idx)
    upper = math.ceil(idx)
    if lower == upper:
        return sorted_values[int(idx)]
    fraction = idx - lower
    return (
        sorted_values[lower] + (sorted_values[upper] - sorted_values[lower]) * fraction
    )


def build_empirical_distribution(values: list[float]) -> dict | None:
    if len(values) < 2:
        return None

    sorted_values = sorted(values)
    range_min = percentile(sorted_values, 0.01)
    range_max = percentile(sorted_values, 0.99)

    buckets = [0] * BUCKET_COUNT
    span = range_max - range_min
    if span <= 0:
        return None

    for value in values:
        if value < range_min or value > range_max:
            continue
        bucket_index = min(
            int((value - range_min) / span * BUCKET_COUNT), BUCKET_COUNT - 1
        )
        buckets[bucket_index] += 1

    return {"rangeMin": range_min, "rangeMax": range_max, "buckets": buckets}


def build_parametric_distribution(values: list[float]) -> dict | None:
    if len(values) < 2:
        return None

    mean = statistics.mean(values)
    stddev = statistics.stdev(values)
    if stddev == 0:
        return None

    skewness = sum(((v - mean) / stddev) ** 3 for v in values) / len(values)

    return {"mean": mean, "stddev": stddev, "skewness": skewness}


def with_computed_at(payload: dict) -> dict:
    return {**payload, "computedAt": datetime.now(timezone.utc).isoformat()}


def run() -> None:
    for stat in EMPIRICAL_STATS:
        values = fetch_column_values(stat["column"], stat["qualified_column"])
        distribution = build_empirical_distribution(values)
        if distribution:
            upsert_stat_distribution(
                stat["key"], "empirical", with_computed_at(distribution)
            )

    for stat in EMPIRICAL_RATE_STATS:
        values = fetch_rate_values(
            stat["numerator"],
            stat["denominator"],
            stat["per"],
            stat["qualified_column"],
        )
        distribution = build_empirical_distribution(values)
        if distribution:
            upsert_stat_distribution(
                stat["key"], "empirical", with_computed_at(distribution)
            )

    for stat in PARAMETRIC_STATS:
        values = fetch_column_values(stat["column"], stat["qualified_column"])
        distribution = build_parametric_distribution(values)
        if distribution:
            upsert_stat_distribution(
                stat["key"], "parametric", with_computed_at(distribution)
            )

    for stat in PARAMETRIC_RATE_STATS:
        values = fetch_rate_values(
            stat["numerator"],
            stat["denominator"],
            stat["per"],
            stat["qualified_column"],
        )
        distribution = build_parametric_distribution(values)
        if distribution:
            upsert_stat_distribution(
                stat["key"], "parametric", with_computed_at(distribution)
            )


if __name__ == "__main__":
    run()
