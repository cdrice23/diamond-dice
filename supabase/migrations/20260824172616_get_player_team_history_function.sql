CREATE OR REPLACE FUNCTION get_player_team_history(p_player_id uuid)
RETURNS TABLE (
  team_name text,
  start_year int,
  end_year int
)
LANGUAGE sql
STABLE
AS $$
  WITH player_team_years AS (
    SELECT DISTINCT
      t.id AS team_id,
      t.name AS team_name,
      EXTRACT(YEAR FROM h.start_date)::int AS season_year
    FROM player_mlb_team_history h
    JOIN mlb_teams t ON t.id = h.mlb_team_id
    WHERE h.player_id = p_player_id
  ),
  islands AS (
    SELECT
      team_id,
      team_name,
      season_year,
      season_year - ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY season_year) AS island_key
    FROM player_team_years
  )
  SELECT
    team_name,
    MIN(season_year) AS start_year,
    MAX(season_year) AS end_year
  FROM islands
  GROUP BY team_id, team_name, island_key
  ORDER BY MIN(season_year);
$$;