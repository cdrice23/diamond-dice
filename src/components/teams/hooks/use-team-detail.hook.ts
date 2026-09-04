import { runWithConcurrencyLimit } from '@/utils/prefetch-queue';
import { supabase } from '@/utils/supabase';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as RNImage } from 'react-native';
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

function prefetchTeamDetailAvatars(positionPlayers: TeamDetailPositionSlot[], pitchers: TeamDetailPitcherSlot[]): void {
  const urls = [
    ...positionPlayers.map((slot) => slot.player.image_url),
    ...pitchers.map((slot) => slot.player.image_url),
  ].filter((url): url is string => Boolean(url));

  if (urls.length === 0) return;

  runWithConcurrencyLimit(urls, urls.length, async (url) => {
    await Promise.all([ExpoImage.prefetch(url), RNImage.prefetch(url)]);
  }).catch((error) => {
    console.warn('prefetchTeamDetailAvatars: batch failed', error);
  });
}

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
      const positionPlayers = row.position_players as TeamDetailPositionSlot[];
      const pitchers = row.pitchers as TeamDetailPitcherSlot[];

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
        position_players: positionPlayers,
        pitchers,
        recent_games: row.recent_games as TeamDetailRecentGame[],
      });

      prefetchTeamDetailAvatars(positionPlayers, pitchers);
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