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
  WITH effective_roles AS (
    SELECT
      p.*,
      (p.eligible_positions IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(p.eligible_positions) pos WHERE pos <> 'P'
      ) AND p.is_qualified_batter) AS is_effective_batter,
      ('P' = ANY(p.eligible_positions) AND p.is_qualified_pitcher) AS is_effective_pitcher
    FROM players p
  )
  SELECT
    er.id, er.external_id, er.name, er.eligible_positions,
    er.batting_rating_level, er.pitching_rating_level,
    er.is_qualified_batter, er.is_qualified_pitcher
  FROM effective_roles er
  WHERE (er.is_effective_batter OR er.is_effective_pitcher)
    AND (search_term IS NULL OR unaccent(er.name) ILIKE unaccent('%' || search_term || '%'))
    AND (positions IS NULL OR er.eligible_positions && positions)
    AND (debut_date_from IS NULL OR er.mlb_debut_date >= debut_date_from)
    AND (debut_date_to IS NULL OR er.mlb_debut_date <= debut_date_to)
    AND (
      player_type IS NULL
      OR (player_type = 'batter' AND er.is_effective_batter)
      OR (player_type = 'pitcher' AND er.is_effective_pitcher)
    )
    AND (
      rating_levels IS NULL
      OR (player_type = 'batter' AND er.is_effective_batter AND er.batting_rating_level = ANY(rating_levels))
      OR (player_type = 'pitcher' AND er.is_effective_pitcher AND er.pitching_rating_level = ANY(rating_levels))
      OR (
        player_type IS NULL
        AND (
          (er.is_effective_batter AND er.batting_rating_level = ANY(rating_levels))
          OR (er.is_effective_pitcher AND er.pitching_rating_level = ANY(rating_levels))
        )
      )
    )
    AND (
      team_ids IS NULL OR EXISTS (
        SELECT 1 FROM player_mlb_team_history h
        WHERE h.player_id = er.id AND h.mlb_team_id = ANY(team_ids)
      )
    )
    AND (
      award_type_ids IS NULL OR EXISTS (
        SELECT 1 FROM player_awards a
        WHERE a.player_id = er.id AND a.award_type_id = ANY(award_type_ids)
      )
    )
    AND (
      NOT on_my_roster OR EXISTS (
        SELECT 1 FROM roster_slots rs
        JOIN teams t ON t.id = rs.team_id
        WHERE rs.player_id = er.id AND t.owner_id = auth.uid()
      )
    )
  ORDER BY er.name, er.id
  LIMIT page_limit OFFSET page_offset;
$$;