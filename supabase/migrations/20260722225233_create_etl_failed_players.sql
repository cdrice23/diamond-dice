create table etl_failed_players (
  player_id text primary key,
  last_error text,
  attempt_count int not null default 1,
  first_failed_at timestamptz not null default now(),
  last_attempted_at timestamptz not null default now()
);

alter table etl_failed_players enable row level security;