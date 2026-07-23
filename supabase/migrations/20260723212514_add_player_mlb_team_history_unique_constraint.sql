alter table player_mlb_team_history
  add constraint player_mlb_team_history_unique unique (player_id, mlb_team_id, start_date);