import json
from datetime import datetime, timezone
from db import get_connection

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

SB_RATE_STAT = {
    "key": "sb_rate",
    "numerator": "mlb_career_sb",
    "denominator": "mlb_career_pa",
    "per": 650,
    "qualified_column": "is_qualified_batter",
}

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

BUCKET_COUNT = 40


def compute_empirical_distribution(conn, column, qualified_column):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            WITH bounds AS (
              SELECT
                percentile_cont(0.01) WITHIN GROUP (ORDER BY {column}) AS p01,
                percentile_cont(0.99) WITHIN GROUP (ORDER BY {column}) AS p99
              FROM players
              WHERE {qualified_column} = true AND {column} IS NOT NULL
            ),
            bucketed AS (
              SELECT width_bucket(p.{column}, b.p01, b.p99, %s) AS bucket_index
              FROM players p, bounds b
              WHERE p.{qualified_column} = true AND p.{column} IS NOT NULL
            )
            SELECT
              (SELECT p01 FROM bounds) AS range_min,
              (SELECT p99 FROM bounds) AS range_max,
              bucket_index,
              count(*) AS player_count
            FROM bucketed
            GROUP BY bucket_index
            ORDER BY bucket_index;
            """,
            (BUCKET_COUNT,),
        )
        rows = cur.fetchall()

    if not rows:
        return None

    range_min, range_max = rows[0][0], rows[0][1]
    buckets = [0] * BUCKET_COUNT
    for _, _, bucket_index, count in rows:
        if 1 <= bucket_index <= BUCKET_COUNT:
            buckets[bucket_index - 1] = count

    return {
        "rangeMin": float(range_min),
        "rangeMax": float(range_max),
        "buckets": buckets,
    }


def compute_empirical_rate_distribution(
    conn, numerator, denominator, per, qualified_column
):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            WITH rated AS (
              SELECT ({numerator}::numeric / {denominator}) * %s AS rate
              FROM players
              WHERE {qualified_column} = true
                AND {numerator} IS NOT NULL
                AND {denominator} IS NOT NULL
                AND {denominator} > 0
            ),
            bounds AS (
              SELECT
                percentile_cont(0.01) WITHIN GROUP (ORDER BY rate) AS p01,
                percentile_cont(0.99) WITHIN GROUP (ORDER BY rate) AS p99
              FROM rated
            ),
            bucketed AS (
              SELECT width_bucket(r.rate, b.p01, b.p99, %s) AS bucket_index
              FROM rated r, bounds b
            )
            SELECT
              (SELECT p01 FROM bounds) AS range_min,
              (SELECT p99 FROM bounds) AS range_max,
              bucket_index,
              count(*) AS player_count
            FROM bucketed
            GROUP BY bucket_index
            ORDER BY bucket_index;
            """,
            (per, BUCKET_COUNT),
        )
        rows = cur.fetchall()

    if not rows:
        return None

    range_min, range_max = rows[0][0], rows[0][1]
    buckets = [0] * BUCKET_COUNT
    for _, _, bucket_index, count in rows:
        if 1 <= bucket_index <= BUCKET_COUNT:
            buckets[bucket_index - 1] = count

    return {
        "rangeMin": float(range_min),
        "rangeMax": float(range_max),
        "buckets": buckets,
    }


def compute_parametric_distribution(conn, column, qualified_column):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            WITH stats AS (
              SELECT avg({column}) AS m, stddev_samp({column}) AS s
              FROM players
              WHERE {qualified_column} = true AND {column} IS NOT NULL
            )
            SELECT
              s.m,
              s.s,
              avg(power((p.{column} - s.m) / s.s, 3)) AS skewness
            FROM players p, stats s
            WHERE p.{qualified_column} = true AND p.{column} IS NOT NULL
            GROUP BY s.m, s.s;
            """
        )
        row = cur.fetchone()

    if not row:
        return None

    mean, stddev, skewness = row
    return {"mean": float(mean), "stddev": float(stddev), "skewness": float(skewness)}


def compute_parametric_rate_distribution(
    conn, numerator, denominator, per, qualified_column
):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            WITH rated AS (
              SELECT ({numerator}::numeric / {denominator}) * %s AS rate
              FROM players
              WHERE {qualified_column} = true
                AND {numerator} IS NOT NULL
                AND {denominator} IS NOT NULL
                AND {denominator} > 0
            ),
            stats AS (
              SELECT avg(rate) AS m, stddev_samp(rate) AS s FROM rated
            )
            SELECT
              s.m,
              s.s,
              avg(power((r.rate - s.m) / s.s, 3)) AS skewness
            FROM rated r, stats s
            GROUP BY s.m, s.s;
            """,
            (per,),
        )
        row = cur.fetchone()

    if not row:
        return None

    mean, stddev, skewness = row
    return {"mean": float(mean), "stddev": float(stddev), "skewness": float(skewness)}


def upsert_distribution(conn, stat_key, distribution_type, value):
    payload = {**value, "computedAt": datetime.now(timezone.utc).isoformat()}
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO stat_distributions (stat_key, distribution_type, value, computed_at)
            VALUES (%s, %s, %s::jsonb, now())
            ON CONFLICT (stat_key)
            DO UPDATE SET
              distribution_type = EXCLUDED.distribution_type,
              value = EXCLUDED.value,
              computed_at = now();
            """,
            (stat_key, distribution_type, json.dumps(payload)),
        )
    conn.commit()


def run():
    conn = get_connection()
    try:
        for stat in EMPIRICAL_STATS:
            value = compute_empirical_distribution(
                conn, stat["column"], stat["qualified_column"]
            )
            if value:
                upsert_distribution(conn, stat["key"], "empirical", value)

        sb_value = compute_empirical_rate_distribution(
            conn,
            SB_RATE_STAT["numerator"],
            SB_RATE_STAT["denominator"],
            SB_RATE_STAT["per"],
            SB_RATE_STAT["qualified_column"],
        )
        if sb_value:
            upsert_distribution(conn, SB_RATE_STAT["key"], "empirical", sb_value)

        for stat in PARAMETRIC_STATS:
            value = compute_parametric_distribution(
                conn, stat["column"], stat["qualified_column"]
            )
            if value:
                upsert_distribution(conn, stat["key"], "parametric", value)

        for stat in PARAMETRIC_RATE_STATS:
            value = compute_parametric_rate_distribution(
                conn,
                stat["numerator"],
                stat["denominator"],
                stat["per"],
                stat["qualified_column"],
            )
            if value:
                upsert_distribution(conn, stat["key"], "parametric", value)
    finally:
        conn.close()


if __name__ == "__main__":
    run()
