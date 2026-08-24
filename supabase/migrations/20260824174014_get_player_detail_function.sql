CREATE OR REPLACE FUNCTION get_player_detail(p_player_id uuid)
RETURNS TABLE (
  id uuid,
  external_id text,
  name text,
  nickname text,
  hometown text,
  birthday date,
  active boolean,
  mlb_debut_date date,
  eligible_positions text[],
  bats text,
  throws text,
  image_url text,
  is_qualified_batter boolean,
  is_qualified_pitcher boolean,
  batting_rating_level int,
  pitching_rating_level int,
  mlb_career_pa int,
  mlb_career_at_bats int,
  mlb_career_avg numeric,
  mlb_career_obp numeric,
  mlb_career_ops numeric,
  mlb_career_hits int,
  mlb_career_runs int,
  mlb_career_rbi int,
  mlb_career_sb int,
  mlb_career_innings_pitched numeric,
  mlb_career_wins int,
  mlb_career_losses int,
  mlb_career_era numeric,
  mlb_career_whip numeric,
  mlb_career_strikeouts int,
  mlb_career_saves int
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id, p.external_id, p.name, p.nickname, p.hometown, p.birthday, p.active,
    p.mlb_debut_date, p.eligible_positions, p.bats, p.throws, p.image_url,
    p.is_qualified_batter, p.is_qualified_pitcher,
    p.batting_rating_level, p.pitching_rating_level,
    p.mlb_career_pa, p.mlb_career_at_bats, p.mlb_career_avg, p.mlb_career_obp, p.mlb_career_ops,
    p.mlb_career_hits, p.mlb_career_runs, p.mlb_career_rbi, p.mlb_career_sb,
    p.mlb_career_innings_pitched, p.mlb_career_wins, p.mlb_career_losses,
    p.mlb_career_era, p.mlb_career_whip, p.mlb_career_strikeouts, p.mlb_career_saves
  FROM players p
  WHERE p.id = p_player_id;
$$;