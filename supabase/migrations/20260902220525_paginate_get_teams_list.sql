drop function if exists get_teams_list();

create function get_teams_list(
  search_term text default null,
  format_id uuid default null,
  sort_direction text default 'desc',
  page_limit int default 20,
  page_offset int default 0
)
returns table (
  id uuid,
  team_name text,
  home_field_name text,
  team_theme_color_primary text,
  team_theme_color_secondary text,
  format_id uuid,
  format_name text,
  updated_at timestamptz,
  last_played_at timestamptz,
  wins int,
  losses int,
  roster_preview jsonb,
  position_levels jsonb,
  pitcher_levels jsonb,
  batting_order jsonb
)
language sql
stable
as $$
  with roster as (
    select
      rs.team_id,
      rs.current_position,
      rs.current_batting_order,
      p.id as player_id,
      p.name as player_name,
      p.image_url,
      p.batting_rating_level,
      p.pitching_rating_level
    from roster_slots rs
    join players p on p.id = rs.player_id
  )
  select
    t.id,
    t.team_name,
    t.home_field_name,
    t.team_theme_color_primary,
    t.team_theme_color_secondary,
    t.format_id,
    f.name as format_name,
    t.updated_at,
    null::timestamptz as last_played_at,
    0 as wins,
    0 as losses,
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', r.player_id, 'name', r.player_name, 'image_url', r.image_url)) from roster r where r.team_id = t.id),
      '[]'::jsonb
    ) as roster_preview,
    jsonb_build_object(
      'C', (select r.batting_rating_level from roster r where r.team_id = t.id and r.current_position = 'C' limit 1),
      '1B', (select r.batting_rating_level from roster r where r.team_id = t.id and r.current_position = '1B' limit 1),
      '2B', (select r.batting_rating_level from roster r where r.team_id = t.id and r.current_position = '2B' limit 1),
      'SS', (select r.batting_rating_level from roster r where r.team_id = t.id and r.current_position = 'SS' limit 1),
      '3B', (select r.batting_rating_level from roster r where r.team_id = t.id and r.current_position = '3B' limit 1),
      'OF', coalesce((select jsonb_agg(r.batting_rating_level) from roster r where r.team_id = t.id and r.current_position = 'OF'), '[]'::jsonb)
    ) as position_levels,
    coalesce((select jsonb_agg(r.pitching_rating_level) from roster r where r.team_id = t.id and r.current_position = 'P'), '[]'::jsonb) as pitcher_levels,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('position', r.current_position, 'level', r.batting_rating_level) order by r.current_batting_order)
        from roster r
        where r.team_id = t.id and r.current_position != 'P' and r.current_batting_order is not null
      ),
      '[]'::jsonb
    ) as batting_order
  from teams t
  left join formats f on f.id = t.format_id
  where t.owner_id = auth.uid()
    and (search_term is null or unaccent(t.team_name) ilike unaccent('%' || search_term || '%'))
    and (format_id is null or t.format_id = format_id)
  order by
    case when sort_direction = 'asc' then t.updated_at end asc,
    case when sort_direction = 'desc' then t.updated_at end desc
  limit page_limit offset page_offset;
$$;