alter table formats
    drop constraint if exists formats_created_by_fkey,
    drop column if exists created_by;

alter table formats
    alter column name set not null;

alter table format_roster_requirements
    drop constraint if exists format_roster_requirements_format_id_player_type_level_id_key;

alter table format_roster_requirements
    alter column level_id drop not null;

create unique index format_roster_requirements_per_level_uidx
    on format_roster_requirements (format_id, player_type, level_id)
    where level_id is not null;

create unique index format_roster_requirements_aggregate_uidx
    on format_roster_requirements (format_id, player_type)
    where level_id is null;