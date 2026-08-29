alter table formats
    add column team_format_description text,
    add column game_format_description text,
    add column display_order integer;

create unique index formats_display_order_uidx on formats (display_order);