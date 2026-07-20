-- PROFILE --
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  status text not null default 'active' check (status in ('active', 'inactive', 'banned')),
  inactive_reason text,
  created_at timestamptz not null default now(),
  constraint username_format_check check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  constraint inactive_reason_only_when_not_active
    check ((status = 'active' and inactive_reason is null) or status <> 'active')
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, status, created_at)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'username',
    'active',
    now()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;

create policy "profiles_select_all"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- FRIEND_REQUESTS --
create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint sender_not_receiver check (sender_id <> receiver_id)
);

create unique index unique_pending_friend_request
  on friend_requests (sender_id, receiver_id)
  where status = 'pending';

create index idx_friend_requests_receiver on friend_requests (receiver_id);

alter table friend_requests enable row level security;

create policy "friend_requests_select_own"
  on friend_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "friend_requests_insert_own"
  on friend_requests for insert
  to authenticated
  with check (sender_id = auth.uid());

create policy "friend_requests_update_involved"
  on friend_requests for update
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- TEAMS --
create table teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  team_name text not null,
  home_field_name text not null,
  team_theme_color_primary text check (team_theme_color_primary ~ '^#[0-9A-Fa-f]{6}$'),
  team_theme_color_secondary text check (team_theme_color_secondary ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, team_name),
  constraint primary_secondary_theme_colors_distinct
    check (team_theme_color_primary is distinct from team_theme_color_secondary)
);

alter table teams enable row level security;

create policy "teams_select_own" on teams for select to authenticated using (owner_id = auth.uid());
create policy "teams_insert_own" on teams for insert to authenticated with check (owner_id = auth.uid());
create policy "teams_update_own" on teams for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "teams_delete_own" on teams for delete to authenticated using (owner_id = auth.uid());

-- ROSTER_SLOTS --
create table roster_slots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id),
  default_position text not null check (default_position in ('C','1B','2B','SS','3B','OF','DH','P')),
  current_position text check (current_position in ('C','1B','2B','SS','3B','OF','DH','P')),
  default_batting_order int,
  current_batting_order int
);

create unique index unique_current_batting_order on roster_slots (team_id, current_batting_order) where current_batting_order is not null;
create unique index unique_default_batting_order on roster_slots (team_id, default_batting_order) where default_batting_order is not null;
create index idx_roster_slots_team on roster_slots (team_id);
create index idx_roster_slots_player on roster_slots (player_id);