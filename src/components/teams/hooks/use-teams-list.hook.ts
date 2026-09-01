import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';
import type { TeamSummary } from '../teams.types';

export function useTeamsList() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTeams() {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_teams_list');

      if (isMounted) {
        if (error) {
          console.error('get_teams_list failed:', error);
          setTeams([]);
        } else {
          setTeams(
            (data ?? []).map((row: any) => ({
              id: row.id,
              team_name: row.team_name,
              home_field_name: row.home_field_name,
              team_theme_color_primary: row.team_theme_color_primary,
              team_theme_color_secondary: row.team_theme_color_secondary,
              format_name: row.format_name,
              updated_at: row.updated_at,
              last_played_at: row.last_played_at,
              wins: row.wins,
              losses: row.losses,
              roster_preview: row.roster_preview,
              position_levels: row.position_levels,
              pitcher_levels: row.pitcher_levels,
              batting_order: row.batting_order,
            }))
          );
        }
        setLoading(false);
      }
    }

    fetchTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  return { teams, loading };
}