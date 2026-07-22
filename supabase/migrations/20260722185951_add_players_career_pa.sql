alter table players add column mlb_career_pa int;

alter table players add constraint pa_at_least_ab
  check (mlb_career_pa is null or mlb_career_at_bats is null or mlb_career_pa >= mlb_career_at_bats);