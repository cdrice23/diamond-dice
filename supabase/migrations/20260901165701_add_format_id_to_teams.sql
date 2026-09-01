alter table teams
  add column format_id uuid not null references formats(id);