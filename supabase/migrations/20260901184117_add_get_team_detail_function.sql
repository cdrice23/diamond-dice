create function get_team_detail(p_team_id uuid)
returns table (
  id uuid,
  team_name text,
  home_field_name text,
  team_theme_color_primary text,
  team_theme_color_secondary text,
  format_name text,
  wins int,
  losses int,
  games_played int,
  position_players jsonb,
  pitchers jsonb,
  recent_games jsonb
)
language sql
stable
as $$
  with roster as (
    select
      rs.current_position,
      rs.current_batting_order,
      p.id as player_id,
      p.name as player_name,
      p.image_url,
      p.eligible_positions,
      p.batting_rating_level,
      p.pitching_rating_level
    from roster_slots rs
    join players p on p.id = rs.player_id
    where rs.team_id = p_team_id
  )
  select
    t.id,
    t.team_name,
    t.home_field_name,
    t.team_theme_color_primary,
    t.team_theme_color_secondary,
    f.name as format_name,
    0 as wins,
    0 as losses,
    0 as games_played,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'position', r.current_position,
            'battingOrder', r.current_batting_order,
            'player', jsonb_build_object('id', r.player_id, 'name', r.player_name, 'image_url', r.image_url),
            'eligiblePositions', r.eligible_positions,
            'level', r.batting_rating_level
          )
        )
        from roster r
        where r.current_position != 'P'
      ),
      '[]'::jsonb
    ) as position_players,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'player', jsonb_build_object('id', r.player_id, 'name', r.player_name, 'image_url', r.image_url),
            'eligiblePositions', r.eligible_positions,
            'level', r.pitching_rating_level
          )
        )
        from roster r
        where r.current_position = 'P'
      ),
      '[]'::jsonb
    ) as pitchers,
    '[]'::jsonb as recent_games
  from teams t
  left join formats f on f.id = t.format_id
  where t.id = p_team_id and t.owner_id = auth.uid();
$$;