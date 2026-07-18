-- LEVEL --
create table levels (
  id uuid primary key default gen_random_uuid(),
  level int not null unique,
  min_avg numeric(4,3) not null,
  max_avg numeric(4,3) not null,
  min_era numeric(4,2) not null,
  max_era numeric(4,2)
);

insert into levels (level, min_avg, max_avg, min_era, max_era) values
  (1, 0.000, 0.250, 4.01, null),
  (2, 0.251, 0.280, 2.51, 4.00),
  (3, 0.281, 1.000, 0.00, 2.50);

alter table levels enable row level security;

create policy "levels_select_all"
  on levels for select
  to authenticated
  using (true);

-- MLB_TEAM --
create table mlb_teams (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  abbreviation text
);

alter table mlb_teams enable row level security;

create policy "mlb_teams_select_all"
  on mlb_teams for select
  to authenticated
  using (true);

-- PLAYER --
create table players (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  nickname text,
  hometown text,
  birthday date,
  active boolean not null default true,
  mlb_debut_date date,
  eligible_positions text[] not null default '{}',
  bats text check (bats in ('left', 'right', 'both')),
  throws text check (throws in ('left', 'right', 'both')),

  mlb_career_avg numeric(4,3),
  mlb_career_era numeric(4,2),
  mlb_career_at_bats int,
  mlb_career_runs int,
  mlb_career_hits int,
  mlb_career_rbi int,
  mlb_career_sb int,
  mlb_career_obp numeric(4,3),
  mlb_career_ops numeric(4,3),
  mlb_career_wins int,
  mlb_career_losses int,
  mlb_career_saves int,
  mlb_career_innings_pitched numeric(5,1),
  mlb_career_strikeouts int,
  mlb_career_whip numeric(4,3),

  batting_rating_level int references levels(level),
  pitching_rating_level int references levels(level),
  is_qualified_batter boolean not null default false,
  is_qualified_pitcher boolean not null default false,

  image_url text,

  constraint at_least_one_stat_line
    check (mlb_career_avg is not null or mlb_career_era is not null),
  constraint batting_level_matches_avg
    check ((batting_rating_level is null) = (mlb_career_avg is null)),
  constraint pitching_level_matches_era
    check ((pitching_rating_level is null) = (mlb_career_era is null))
);

create index idx_players_name on players (name);
create index idx_players_name_search on players using gin (to_tsvector('english', name));

alter table players enable row level security;

create policy "players_select_all"
  on players for select
  to authenticated
  using (true);

-- PLAYER_MLB_TEAM_HISTORY --
create table player_mlb_team_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  mlb_team_id uuid not null references mlb_teams(id),
  start_date date not null,
  end_date date
);

create index idx_pmth_player on player_mlb_team_history (player_id);

alter table player_mlb_team_history enable row level security;

create policy "player_mlb_team_history_select_all"
  on player_mlb_team_history for select
  to authenticated
  using (true);

-- AWARD_TYPE --
create table award_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  league text,
  unique (name, league)
);

alter table award_types enable row level security;

create policy "award_types_select_all"
  on award_types for select
  to authenticated
  using (true);

-- PLAYER_AWARD --
create table player_awards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  award_type_id uuid not null references award_types(id),
  season int not null,
  unique (player_id, award_type_id, season)
);

create index idx_player_awards_player on player_awards (player_id);

alter table player_awards enable row level security;

create policy "player_awards_select_all"
  on player_awards for select
  to authenticated
  using (true);