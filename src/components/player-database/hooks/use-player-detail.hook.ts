import type { PlayerAwardRow, PlayerAwardSummary } from '@/components/player-database/player-database.types';
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';
import { groupPlayerAwards } from '../utils/group-player-awards';

export type PlayerDetail = {
  id: string;
  external_id: string;
  name: string;
  nickname: string | null;
  hometown: string | null;
  birthday: string | null;
  active: boolean;
  mlb_debut_date: string | null;
  eligible_positions: string[];
  bats: string | null;
  throws: string | null;
  image_url: string | null;
  is_qualified_batter: boolean;
  is_qualified_pitcher: boolean;
  batting_rating_level: number | null;
  pitching_rating_level: number | null;
  mlb_career_pa: number | null;
  mlb_career_at_bats: number | null;
  mlb_career_avg: number | null;
  mlb_career_obp: number | null;
  mlb_career_ops: number | null;
  mlb_career_hits: number | null;
  mlb_career_runs: number | null;
  mlb_career_rbi: number | null;
  mlb_career_sb: number | null;
  mlb_career_innings_pitched: number | null;
  mlb_career_wins: number | null;
  mlb_career_losses: number | null;
  mlb_career_era: number | null;
  mlb_career_whip: number | null;
  mlb_career_strikeouts: number | null;
  mlb_career_saves: number | null;
};

export type PlayerTeamHistoryRow = {
  team_name: string;
  start_year: number;
  end_year: number;
};

type PlayerDetailState = {
  player: PlayerDetail | null;
  teamHistory: PlayerTeamHistoryRow[];
  awardSummaries: PlayerAwardSummary[];
  loading: boolean;
  error: string | null;
};

export function usePlayerDetail(playerId: string) {
  const [state, setState] = useState<PlayerDetailState>({
    player: null,
    teamHistory: [],
    awardSummaries: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const [detailResult, teamHistoryResult, awardsResult] = await Promise.all([
        supabase.rpc('get_player_detail', { p_player_id: playerId }),
        supabase.rpc('get_player_team_history', { p_player_id: playerId }),
        supabase.rpc('get_player_awards', { p_player_id: playerId }),
      ]);

      if (!isMounted) return;

      if (detailResult.error || teamHistoryResult.error || awardsResult.error) {
        console.error(
          'usePlayerDetail failed:',
          detailResult.error ?? teamHistoryResult.error ?? awardsResult.error
        );
        setState({
          player: null,
          teamHistory: [],
          awardSummaries: [],
          loading: false,
          error: 'Failed to load player details.',
        });
        return;
      }

      const player: PlayerDetail | null = detailResult.data?.[0] ?? null;
      const teamHistory: PlayerTeamHistoryRow[] = teamHistoryResult.data ?? [];
      const awardRows: PlayerAwardRow[] = awardsResult.data ?? [];

      setState({
        player,
        teamHistory,
        awardSummaries: groupPlayerAwards(awardRows),
        loading: false,
        error: null,
      });
    }

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [playerId]);

  return state;
}