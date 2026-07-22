-- Updates limits for pitching stats and OPS --
alter table players alter column mlb_career_era type numeric(7,2);
alter table players alter column mlb_career_whip type numeric(7,3);
alter table players alter column mlb_career_ops type numeric(6,3);
