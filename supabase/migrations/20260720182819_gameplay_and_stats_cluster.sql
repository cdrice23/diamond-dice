-- INNINGS --
create table innings (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  inning int not null,
  inning_half text not null check (inning_half in ('top', 'bottom')),
  inning_runs int not null default 0,
  inning_hits int not null default 0,
  inning_errors int not null default 0,
  unique (game_id, inning, inning_half)
);

create index idx_innings_game on innings (game_id);

alter table innings enable row level security;

create policy "innings_select_participant" on innings for select to authenticated
  using (is_game_participant(game_id));


-- AT_BATS --
create table at_bats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  batter_roster_slot_id uuid not null references roster_slots(id),
  pitcher_roster_slot_id uuid not null references roster_slots(id),
  inning int not null,
  inning_half text not null check (inning_half in ('top', 'bottom')),
  at_bat_start timestamptz not null default now(),
  at_bat_finish timestamptz,
  total_balls int not null default 0,
  total_strikes int not null default 0,
  connection boolean not null default false,
  connection_on_advantage boolean not null default false,
  outcome text check (outcome is null or outcome in ('walk', 'strikeout', 'out_fielded', 'out_played', 'hit')),
  fielded_by_roster_slot_id uuid references roster_slots(id),
  bases_advanced int,
  advantage_used_count int not null default 0,
  advantage_modifier int,
  advantage_used_by text check (advantage_used_by in ('batter', 'pitcher')),

  constraint fielded_by_only_when_out_fielded
    check (fielded_by_roster_slot_id is null or outcome = 'out_fielded')
);

create index idx_at_bats_game on at_bats (game_id);

alter table at_bats enable row level security;

create policy "at_bats_select_participant" on at_bats for select to authenticated
  using (is_game_participant(game_id));


-- PLAYS --
create table plays (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  inning int not null,
  inning_half text not null check (inning_half in ('top', 'bottom')),
  fielding_team_id uuid not null references teams(id),
  outcome text check (outcome is null or outcome in ('success', 'fail', 'error')),
  targeted_roster_slot_id uuid references roster_slots(id),
  initiated_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint targeted_slot_required_unless_fail_or_pending
    check (targeted_roster_slot_id is not null or outcome is null or outcome = 'fail')
);

create index idx_plays_game on plays (game_id);

alter table plays enable row level security;

create policy "plays_select_participant" on plays for select to authenticated
  using (is_game_participant(game_id));


-- BATTER_GAME_STATS --
create table batter_game_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id),
  player_id uuid not null references players(id),
  dd_at_bats int not null default 0,
  dd_singles int not null default 0,
  dd_doubles int not null default 0,
  dd_triples int not null default 0,
  dd_home_runs int not null default 0,
  dd_outs_fielded int not null default 0,
  dd_outs_played int not null default 0,
  dd_walks int not null default 0,
  dd_bases_advanced int not null default 0,
  dd_connections int not null default 0,
  dd_connections_on_advantage int not null default 0,
  dd_total_hits int not null default 0,
  dd_rbi int not null default 0,
  dd_advantages_used int not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create index idx_batter_game_stats_game on batter_game_stats (game_id);
create index idx_batter_game_stats_player on batter_game_stats (player_id);

alter table batter_game_stats enable row level security;

create policy "batter_game_stats_select_participant" on batter_game_stats for select to authenticated
  using (is_game_participant(game_id));


-- PITCHER_GAME_STATS --
create table pitcher_game_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id),
  player_id uuid not null references players(id),
  dd_batters_faced int not null default 0,
  dd_outs_recorded int not null default 0,
  dd_hits_allowed int not null default 0,
  dd_walks_allowed int not null default 0,
  dd_home_runs_allowed int not null default 0,
  dd_runs_allowed int not null default 0,
  dd_connections_allowed int not null default 0,
  dd_connections_allowed_on_advantage int not null default 0,
  dd_advantages_used int not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create index idx_pitcher_game_stats_game on pitcher_game_stats (game_id);
create index idx_pitcher_game_stats_player on pitcher_game_stats (player_id);

alter table pitcher_game_stats enable row level security;

create policy "pitcher_game_stats_select_participant" on pitcher_game_stats for select to authenticated
  using (is_game_participant(game_id));