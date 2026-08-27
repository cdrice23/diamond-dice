alter table formats
    rename column default_max_advantage_per_at_bat to default_bonus_advantage_per_at_bat;

alter table games
    rename column max_advantage_per_at_bat to bonus_advantage_per_at_bat;

alter table game_configuration_proposals
    rename column max_advantage_per_at_bat to bonus_advantage_per_at_bat;