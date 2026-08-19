-- Required for trigram-indexed partial-text name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_players_name_trgm
  ON players USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_players_eligible_positions
  ON players USING gin (eligible_positions);

CREATE INDEX IF NOT EXISTS idx_players_batting_rating_level
  ON players (batting_rating_level);

CREATE INDEX IF NOT EXISTS idx_players_pitching_rating_level
  ON players (pitching_rating_level);

CREATE INDEX IF NOT EXISTS idx_players_mlb_debut_date
  ON players (mlb_debut_date);

-- FK columns are not auto-indexed by Postgres; both existing unique
-- constraints lead with player_id, so team_id/award_type_id-first lookups
-- (used heavily by search_player_db) would otherwise force a sequential scan.
CREATE INDEX IF NOT EXISTS idx_player_mlb_team_history_team_id
  ON player_mlb_team_history (mlb_team_id);

CREATE INDEX IF NOT EXISTS idx_player_awards_award_type_id
  ON player_awards (award_type_id);