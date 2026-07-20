-- FORMATS --
create table formats (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid references profiles(id) on delete cascade,
  default_max_advantage_per_at_bat int not null,
  default_max_plays_per_inning_half int not null,
  default_starter_requirement_type text not null check (default_starter_requirement_type in ('pitch_count', 'innings')),
  default_starter_requirement_value numeric not null,
  created_at timestamptz not null default now()
);

-- FORMAT_ROSTER_REQUIREMENTS -- 
create table format_roster_requirements (
  id uuid primary key default gen_random_uuid(),
  format_id uuid not null references formats(id) on delete cascade,
  player_type text not null check (player_type in ('batter', 'pitcher')),
  level_id uuid not null references levels(id),
  min_count int not null,
  max_count int,
  unique (format_id, player_type, level_id)
);

-- GAMES --
create table games (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid not null references teams(id),
  away_team_id uuid not null references teams(id),
  format_id uuid not null references formats(id),
  starter_requirement_type text not null check (starter_requirement_type in ('pitch_count', 'innings')),
  starter_requirement_value numeric not null,
  max_advantage_per_at_bat int not null,
  max_plays_per_inning_half int not null,

  status text not null default 'awaiting_game_configuration' check (status in (
    'awaiting_game_configuration', 'awaiting_lineup_setup',
    'awaiting_starting_pitcher_home', 'awaiting_starting_pitcher_away',
    'in_progress', 'completed', 'forfeited', 'abandoned'
  )),
  home_lineup_confirmed_at timestamptz,
  away_lineup_confirmed_at timestamptz,
  inning int not null default 1,
  inning_half text not null default 'top' check (inning_half in ('top', 'bottom')),
  current_outs int not null default 0,
  current_balls int not null default 0,
  current_strikes int not null default 0,
  current_home_score int not null default 0,
  current_away_score int not null default 0,
  first_base_roster_slot_id uuid references roster_slots(id),
  second_base_roster_slot_id uuid references roster_slots(id),
  third_base_roster_slot_id uuid references roster_slots(id),
  current_batter_roster_slot_id uuid references roster_slots(id),
  current_pitcher_roster_slot_id uuid references roster_slots(id),
  turn_deadline timestamptz,
  home_disconnected_at timestamptz,
  away_disconnected_at timestamptz,
  winner_team_id uuid references teams(id),
  outcome_reason text check (outcome_reason in ('normal_completion', 'forfeit', 'disconnect_timeout')),
  ended_at timestamptz,
  created_at timestamptz not null default now(),

  constraint home_away_teams_distinct check (home_team_id <> away_team_id),
  constraint winner_is_participant check (winner_team_id is null or winner_team_id in (home_team_id, away_team_id)),
  constraint ended_at_only_when_terminal
    check (ended_at is null or status in ('completed', 'forfeited', 'abandoned'))
);

create or replace function public.is_game_participant(p_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_home_team_id uuid;
  v_away_team_id uuid;
begin
  select home_team_id, away_team_id into v_home_team_id, v_away_team_id
  from games where id = p_game_id;

  if v_home_team_id is null then
    return false;
  end if;

  return exists (
    select 1 from teams
    where id in (v_home_team_id, v_away_team_id)
    and owner_id = auth.uid()
  );
end;
$$;

create or replace function public.is_team_in_my_game(p_team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from games
    where (home_team_id = p_team_id or away_team_id = p_team_id)
    and (
      exists (select 1 from teams where id = games.home_team_id and owner_id = auth.uid())
      or exists (select 1 from teams where id = games.away_team_id and owner_id = auth.uid())
    )
  );
end;
$$;

alter table games enable row level security;

create policy "games_select_participant" on games for select to authenticated
  using (
    exists (select 1 from teams where teams.id = games.home_team_id and teams.owner_id = auth.uid())
    or exists (select 1 from teams where teams.id = games.away_team_id and teams.owner_id = auth.uid())
  );

create policy "games_insert_participant" on games for insert to authenticated
  with check (
    exists (select 1 from teams where teams.id = home_team_id and teams.owner_id = auth.uid())
    or exists (select 1 from teams where teams.id = away_team_id and teams.owner_id = auth.uid())
  );

create policy "games_update_participant" on games for update to authenticated
  using (
    exists (select 1 from teams where teams.id = games.home_team_id and teams.owner_id = auth.uid())
    or exists (select 1 from teams where teams.id = games.away_team_id and teams.owner_id = auth.uid())
  );

-- EXTEND TEAMS AND FORMATS VISIBILITY TO GAME OPPONENTS -- 
create policy "teams_select_as_opponent" on teams for select to authenticated
  using (is_team_in_my_game(id));

create policy "formats_select_as_game_participant" on formats for select to authenticated
  using (exists (select 1 from games where games.format_id = formats.id and is_game_participant(games.id)));

-- GAME_CONFIGURATION_PROPOSALS --
create table game_configuration_proposals (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  format_id uuid not null references formats(id),
  proposed_by text not null check (proposed_by in ('home', 'away')),
  max_advantage_per_at_bat int not null,
  max_plays_per_inning_half int not null,
  starter_requirement_type text not null check (starter_requirement_type in ('pitch_count', 'innings')),
  starter_requirement_value numeric not null,
  outcome text not null default 'pending' check (outcome in ('pending', 'accepted', 'superseded', 'timed_out')),
  proposal_deadline timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint resolved_at_only_when_not_pending
    check (resolved_at is null or outcome <> 'pending')
);

create unique index unique_pending_proposal_per_game
  on game_configuration_proposals (game_id) where outcome = 'pending';

alter table game_configuration_proposals enable row level security;

create policy "game_configuration_proposals_select_participant"
  on game_configuration_proposals for select to authenticated
  using (is_game_participant(game_id));

create policy "game_configuration_proposals_insert_participant"
  on game_configuration_proposals for insert to authenticated
  with check (is_game_participant(game_id));

-- GAME PITCHERS --
create table game_pitchers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  roster_slot_id uuid not null references roster_slots(id),
  team_id uuid not null references teams(id),
  pitching_order int not null,
  usage_count int,
  unique (game_id, roster_slot_id),
  unique (game_id, team_id, pitching_order)
);

alter table game_pitchers enable row level security;

create policy "game_pitchers_select_participant"
  on game_pitchers for select to authenticated
  using (is_game_participant(game_id));

create policy "game_pitchers_insert_participant"
  on game_pitchers for insert to authenticated
  with check (is_game_participant(game_id));

create policy "game_pitchers_update_participant"
  on game_pitchers for update to authenticated
  using (is_game_participant(game_id));