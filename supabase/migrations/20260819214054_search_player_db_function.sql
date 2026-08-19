CREATE OR REPLACE FUNCTION search_player_db(
  search_term text DEFAULT NULL,
  player_type text DEFAULT NULL,
  rating_level int DEFAULT NULL,
  positions text[] DEFAULT NULL,
  team_id uuid DEFAULT NULL,
  award_type_id uuid DEFAULT NULL,
  on_my_roster boolean DEFAULT false,
  debut_date_from date DEFAULT NULL,
  debut_date_to date DEFAULT NULL,
  page_limit int DEFAULT 30,
  page_offset int DEFAULT 0
)
RETURNS SETOF players
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM players p
  WHERE (p.is_qualified_batter OR p.is_qualified_pitcher)
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%')
    AND (positions IS NULL OR p.eligible_positions && positions)
    AND (debut_date_from IS NULL OR p.mlb_debut_date >= debut_date_from)
    AND (debut_date_to IS NULL OR p.mlb_debut_date <= debut_date_to)
    AND (
      player_type IS NULL
      OR (player_type = 'batter' AND p.is_qualified_batter)
      OR (player_type = 'pitcher' AND p.is_qualified_pitcher)
    )
    AND (
      rating_level IS NULL
      OR (player_type = 'batter' AND p.batting_rating_level = rating_level)
      OR (player_type = 'pitcher' AND p.pitching_rating_level = rating_level)
      OR (player_type IS NULL AND (p.batting_rating_level = rating_level OR p.pitching_rating_level = rating_level))
    )
    AND (
      team_id IS NULL OR EXISTS (
        SELECT 1 FROM player_mlb_team_history h
        WHERE h.player_id = p.id AND h.mlb_team_id = team_id
      )
    )
    AND (
      award_type_id IS NULL OR EXISTS (
        SELECT 1 FROM player_awards a
        WHERE a.player_id = p.id AND a.award_type_id = award_type_id
      )
    )
    AND (
      NOT on_my_roster OR EXISTS (
        SELECT 1 FROM roster_slots rs
        JOIN teams t ON t.id = rs.team_id
        WHERE rs.player_id = p.id AND t.owner_id = auth.uid()
      )
    )
  ORDER BY p.name
  LIMIT page_limit OFFSET page_offset;
$$;