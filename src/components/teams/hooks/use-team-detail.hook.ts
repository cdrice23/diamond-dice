import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamDetail, TeamDetailPitcherSlot, TeamDetailPositionSlot, TeamDetailRecentGame } from '../teams.types';

type TeamDetailRow = {
  id: string;
  team_name: string;
  home_field_name: string;
  team_theme_color_primary: string;
  team_theme_color_secondary: string;
  format_id: string;
  format_name: string;
  wins: number;
  losses: number;
  games_played: number;
  position_players: unknown;
  pitchers: unknown;
  recent_games: unknown;
};

export function useTeamDetail(teamId: string | undefined) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchCount, setFetchCount] = useState(0);
  const isMountedRef = useRef(true);

  const fetchTeam = useCallback(async () => {
    if (!teamId) {
      setTeam(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_team_detail', { p_team_id: teamId }).maybeSingle();

    if (!isMountedRef.current) return;

    if (error) {
      console.error('get_team_detail failed:', error);
      setTeam(null);
    } else if (data) {
      const row = data as TeamDetailRow;
      setTeam({
        id: row.id,
        team_name: row.team_name,
        home_field_name: row.home_field_name,
        team_theme_color_primary: row.team_theme_color_primary,
        team_theme_color_secondary: row.team_theme_color_secondary,
        format_id: row.format_id,
        format_name: row.format_name,
        wins: row.wins,
        losses: row.losses,
        games_played: row.games_played,
        position_players: row.position_players as TeamDetailPositionSlot[],
        pitchers: row.pitchers as TeamDetailPitcherSlot[],
        recent_games: row.recent_games as TeamDetailRecentGame[],
      });
    } else {
      setTeam(null);
    }
    setLoading(false);
    setFetchCount((prev) => prev + 1);
  }, [teamId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTeam();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTeam]);

  return { team, loading, refetch: fetchTeam, fetchCount };
}