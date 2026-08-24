CREATE OR REPLACE FUNCTION get_player_awards(p_player_id uuid)
RETURNS TABLE (
  award_external_id text,
  award_name text,
  season int
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    at.external_id AS award_external_id,
    at.name AS award_name,
    pa.season
  FROM player_awards pa
  JOIN award_types at ON at.id = pa.award_type_id
  WHERE pa.player_id = p_player_id
  ORDER BY pa.season;
$$;