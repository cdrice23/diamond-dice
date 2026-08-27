-- Shared mechanical defaults across every Format except All-Star Game:
--   bonus_advantage_per_at_bat = 0   (no bonus beyond rulebook level-difference math)
--   max_plays_per_inning_half  = 1
--   starter_requirement_type   = 'innings'
--   starter_requirement_value  = 5

insert into formats (id, name, default_bonus_advantage_per_at_bat, default_max_plays_per_inning_half, default_starter_requirement_type, default_starter_requirement_value)
values
    (gen_random_uuid(), 'Standard',            0, 1, 'innings', 5),
    (gen_random_uuid(), 'Sandlot',              0, 1, 'innings', 5),
    (gen_random_uuid(), 'Scrub League',         0, 1, 'innings', 5),
    (gen_random_uuid(), 'Hall of Pretty Good',  0, 1, 'innings', 5),
    (gen_random_uuid(), 'Elite Ball',           0, 1, 'innings', 5),
    (gen_random_uuid(), 'All-Star Game',        0, 1, 'innings', 1);

-- ---------------------------------------------------------------------
-- Standard: 2 Lvl3 / 3 Lvl2 / 4 Lvl1 batters; 1 pitcher of each level
-- ---------------------------------------------------------------------
insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, l.id, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  1, 4, 4),
    ('batter',  2, 3, 3),
    ('batter',  3, 2, 2),
    ('pitcher', 1, 1, 1),
    ('pitcher', 2, 1, 1),
    ('pitcher', 3, 1, 1)
) as v(player_type, level, min_count, max_count)
join levels l on l.level = v.level
where f.name = 'Standard';

-- ---------------------------------------------------------------------
-- Sandlot: no level restrictions, aggregate caps only
-- ---------------------------------------------------------------------
insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, null, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  9, 9),
    ('pitcher', 3, 5)
) as v(player_type, min_count, max_count)
where f.name = 'Sandlot';

-- ---------------------------------------------------------------------
-- Scrub League: Level 1 only, other levels locked to 0
-- ---------------------------------------------------------------------
insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, l.id, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  1, 9, 9),
    ('batter',  2, 0, 0),
    ('batter',  3, 0, 0),
    ('pitcher', 1, 3, 5),
    ('pitcher', 2, 0, 0),
    ('pitcher', 3, 0, 0)
) as v(player_type, level, min_count, max_count)
join levels l on l.level = v.level
where f.name = 'Scrub League';

-- ---------------------------------------------------------------------
-- Hall of Pretty Good: Level 2 only, other levels locked to 0
-- ---------------------------------------------------------------------
insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, l.id, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  1, 0, 0),
    ('batter',  2, 9, 9),
    ('batter',  3, 0, 0),
    ('pitcher', 1, 0, 0),
    ('pitcher', 2, 3, 5),
    ('pitcher', 3, 0, 0)
) as v(player_type, level, min_count, max_count)
join levels l on l.level = v.level
where f.name = 'Hall of Pretty Good';

-- ---------------------------------------------------------------------
-- Elite Ball: Level 3 only, other levels locked to 0
-- ---------------------------------------------------------------------
insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, l.id, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  1, 0, 0),
    ('batter',  2, 0, 0),
    ('batter',  3, 9, 9),
    ('pitcher', 1, 0, 0),
    ('pitcher', 2, 0, 0),
    ('pitcher', 3, 3, 5)
) as v(player_type, level, min_count, max_count)
join levels l on l.level = v.level
where f.name = 'Elite Ball';

-- ---------------------------------------------------------------------
-- All-Star Game: batters and pitchers both level-agnostic, aggregate only
-- ---------------------------------------------------------------------
insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, null, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  9, 9),
    ('pitcher', 9, 9)
) as v(player_type, min_count, max_count)
where f.name = 'All-Star Game';