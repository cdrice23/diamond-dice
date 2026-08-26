create table stat_distributions (
  stat_key text primary key,
  distribution_type text not null check (distribution_type in ('empirical', 'parametric')),
  value jsonb not null,
  computed_at timestamptz not null default now()
);

alter table stat_distributions enable row level security;

create policy "Stat distributions are publicly readable"
  on stat_distributions for select
  to authenticated
  using (true);