drop policy if exists "formats_insert_own" on formats;

drop policy if exists "formats_select_presets_and_own" on formats;

create policy "formats_select_all" on formats for select to authenticated
  using (true);