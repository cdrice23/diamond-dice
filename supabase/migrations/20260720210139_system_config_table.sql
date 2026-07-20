-- SYSTEM_CONFIG --
create table system_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

alter table system_config enable row level security;
-- Deliberately no policies — this table is unreachable from the
-- `authenticated` role entirely. Only the secret key (Dashboard SQL
-- Editor, or a trusted Edge Function) can read or write it.

insert into system_config (key, value) values
  ('turn_duration_seconds', '90'),
  ('disconnect_grace_period_seconds', '120'),
  ('proposal_duration_seconds', '120');