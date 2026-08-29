update formats set
    team_format_description = 'The classic, balanced format - just like the physical Diamond Dice game.',
    game_format_description = 'The classic, balanced format - closest to physical Diamond Dice Game',
    display_order = 1
where name = 'Standard';

update formats set
    team_format_description = 'No level restrictions - anyone is welcome on this diamond.',
    game_format_description = 'Free for all with no level restrictions',
    display_order = 2
where name = 'Sandlot';

update formats set
    team_format_description = 'Level 1 players only - they are just glad to be in the Show.',
    game_format_description = 'Restricted to Level 1 Players only',
    display_order = 3
where name = 'Scrub League';

update formats set
    team_format_description = 'Level 2 players only - guys that are pretty good.',
    game_format_description = 'Restricted to Level 2 Players only',
    display_order = 4
where name = 'Journeyman';

update formats set
    team_format_description = 'Level 3 players only - featuring the best to ever do it.',
    game_format_description = 'Restricted to Level 3 Players only',
    display_order = 5
where name = 'Elite Ball';

update formats set
    team_format_description = 'Balanced rosters, pitchers rotate every inning - great for showcasing pitching arms.',
    game_format_description = 'Balanced rosters, pitchers rotate every inning',
    display_order = 6
where name = 'Bullpen';