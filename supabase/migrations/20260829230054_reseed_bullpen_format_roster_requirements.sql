delete from format_roster_requirements
where format_id = (select id from formats where name = 'Bullpen');

insert into format_roster_requirements (id, format_id, player_type, level_id, min_count, max_count)
select gen_random_uuid(), f.id, v.player_type, l.id, v.min_count, v.max_count
from formats f
cross join (values
    ('batter',  1, 3, 3),
    ('batter',  2, 3, 3),
    ('batter',  3, 3, 3),
    ('pitcher', 1, 3, 3),
    ('pitcher', 2, 3, 3),
    ('pitcher', 3, 3, 3)
) as v(player_type, level, min_count, max_count)
join levels l on l.level = v.level
where f.name = 'Bullpen';