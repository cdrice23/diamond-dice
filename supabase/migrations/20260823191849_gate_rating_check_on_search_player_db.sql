DROP FUNCTION IF EXISTS search_player_db(text, text, int[], text[], uuid[], uuid[], boolean, date, date, int, int);

CREATE FUNCTION search_player_db(
  search_term text DEFAULT NULL,
  player_type text DEFAULT NULL,
  rating_levels int[] DEFAULT NULL,
  positions text[] DEFAULT NULL,
  team_ids uuid[] DEFAULT NULL,
  award_type_ids uuid[] DEFAULT NULL,
  on_my_roster boolean DEFAULT false,
  debut_date_from date DEFAULT NULL,
  debut_date_to date DEFAULT NULL,
  page_limit int DEFAULT 30,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  external_id text,
  name text,
  eligible_positions text[],
  batting_rating_level int,
  pitching_rating_level int,
  is_qualified_batter boolean,
  is_qualified_pitcher boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id, p.external_id, p.name, p.eligible_positions,
    p.batting_rating_level, p.pitching_rating_level,
    p.is_qualified_batter, p.is_qualified_pitcher
  FROM players p
  WHERE (p.is_qualified_batter OR p.is_qualified_pitcher)
    AND (search_term IS NULL OR unaccent(p.name) ILIKE unaccent('%' || search_term || '%'))
    AND (positions IS NULL OR p.eligible_positions && positions)
    AND (debut_date_from IS NULL OR p.mlb_debut_date >= debut_date_from)
    AND (debut_date_to IS NULL OR p.mlb_debut_date <= debut_date_to)
    AND (
      player_type IS NULL
      OR (player_type = 'batter' AND p.is_qualified_batter)
      OR (player_type = 'pitcher' AND p.is_qualified_pitcher)
    )
    AND (
      rating_levels IS NULL
      OR (player_type = 'batter' AND p.is_qualified_batter AND p.batting_rating_level = ANY(rating_levels))
      OR (player_type = 'pitcher' AND p.is_qualified_pitcher AND p.pitching_rating_level = ANY(rating_levels))
      OR (
        player_type IS NULL
        AND (
          (p.is_qualified_batter AND p.batting_rating_level = ANY(rating_levels))
          OR (p.is_qualified_pitcher AND p.pitching_rating_level = ANY(rating_levels))
        )
      )
    )
    AND (
      team_ids IS NULL OR EXISTS (
        SELECT 1 FROM player_mlb_team_history h
        WHERE h.player_id = p.id AND h.mlb_team_id = ANY(team_ids)
      )
    )
    AND (
      award_type_ids IS NULL OR EXISTS (
        SELECT 1 FROM player_awards a
        WHERE a.player_id = p.id AND a.award_type_id = ANY(award_type_ids)
      )
    )
    AND (
      NOT on_my_roster OR EXISTS (
        SELECT 1 FROM roster_slots rs
        JOIN teams t ON t.id = rs.team_id
        WHERE rs.player_id = p.id AND t.owner_id = auth.uid()
      )
    )
  ORDER BY p.name, p.id
  LIMIT page_limit OFFSET page_offset;
$$;