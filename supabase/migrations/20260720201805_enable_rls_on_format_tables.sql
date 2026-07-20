-- ADD RLS ON FORMATS --
alter table formats enable row level security;

create policy "formats_select_presets_and_own" on formats for select to authenticated
  using (created_by is null or created_by = auth.uid());

create policy "formats_insert_own" on formats for insert to authenticated
  with check (created_by = auth.uid());


alter table format_roster_requirements enable row level security;

create policy "format_roster_requirements_select_via_format"
  on format_roster_requirements for select to authenticated
  using (exists (select 1 from formats where formats.id = format_roster_requirements.format_id));