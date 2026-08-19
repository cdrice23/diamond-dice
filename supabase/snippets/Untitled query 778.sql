-- basic: just the qualified-players filter, no other params
  select id, name, batting_rating_level, pitching_rating_level
  from search_player_db()
  limit 5;

  -- position filter
  select id, name, eligible_positions from search_player_db(positions => ARRAY['SS']) limit 5;

  -- rating + type interaction (this is the one worth actually checking against a known two-way player)
  select id, name, batting_rating_level, pitching_rating_level
  from search_player_db(player_type => 'batter', rating_level => 3)
  where name ilike '%ohtani%';