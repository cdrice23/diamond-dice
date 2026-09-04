import { PREFETCH_AVATARS_ENABLED, runWithConcurrencyLimit } from '@/utils/prefetch-queue';
import { supabase } from '@/utils/supabase';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
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

const prefetchedTeamIds = new Set<string>();

function prefetchTeamDetailAvatars(teamId: string, positionPlayers: TeamDetailPositionSlot[], pitchers: TeamDetailPitcherSlot[]): void {
  if (!PREFETCH_AVATARS_ENABLED) return;
  if (prefetchedTeamIds.has(teamId)) return;
  prefetchedTeamIds.add(teamId);

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

export function clearPrefetchedTeamDetailAvatars(): void {
  prefetchedTeamIds.clear();
}

function mapRow(row: TeamDetailRow): TeamDetail {
  return {
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
  };
}

export function useTeamDetail(teamId: string | undefined) {
  const [prevTeamId, setPrevTeamId] = useState(teamId);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(() => Boolean(teamId));
  const [fetchCount, setFetchCount] = useState(0);
  const [refetchNonce, setRefetchNonce] = useState(0);

  if (teamId !== prevTeamId) {
    setPrevTeamId(teamId);
    setTeam(null);
    setLoading(Boolean(teamId));
  }

  useEffect(() => {
    if (!teamId) return;

    let ignore = false;

    (async () => {
      const { data, error } = await supabase.rpc('get_team_detail', { p_team_id: teamId }).maybeSingle();

      if (ignore) return;

      if (error) {
        console.error('get_team_detail failed:', error);
        setTeam(null);
      } else if (data) {
        const detail = mapRow(data as TeamDetailRow);
        setTeam(detail);
        prefetchTeamDetailAvatars(detail.id, detail.position_players, detail.pitchers);
      } else {
        setTeam(null);
      }
      setLoading(false);
      setFetchCount((prev) => prev + 1);
    })();

    return () => {
      ignore = true;
    };
  }, [teamId, refetchNonce]);

  const refetch = useCallback(() => {
    if (!teamId) return;
    setLoading(true);
    setRefetchNonce((prev) => prev + 1);
  }, [teamId]);

  return { team, loading, refetch, fetchCount };
}