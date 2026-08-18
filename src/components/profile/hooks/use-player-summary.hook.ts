import { prefetchImage } from '@/utils/image-cache';
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

type PlayerSummary = {
  name: string;
  imageUrl: string | null;
};

const playerSummaryCache = new Map<string, PlayerSummary>();

export function usePlayerSummary(playerId: string) {
  const cached = playerSummaryCache.get(playerId);
  const [player, setPlayer] = useState<PlayerSummary | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const existing = playerSummaryCache.get(playerId);
    if (existing) {
      setPlayer(existing);
      setLoading(false);
      prefetchImage(existing.imageUrl);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchPlayer() {
      const { data, error } = await supabase
        .from('players')
        .select('name, image_url')
        .eq('id', playerId)
        .single();

      if (!isMounted) return;

      if (error || !data) {
        setPlayer(null);
      } else {
        const summary: PlayerSummary = { name: data.name, imageUrl: data.image_url };
        playerSummaryCache.set(playerId, summary);
        setPlayer(summary);
        prefetchImage(summary.imageUrl);
      }
      setLoading(false);
    }

    fetchPlayer();

    return () => {
      isMounted = false;
    };
  }, [playerId]);

  return { player, loading };
}