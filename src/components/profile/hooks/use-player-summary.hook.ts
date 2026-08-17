import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

type PlayerSummary = {
  name: string;
  imageUrl: string | null;
};

export function usePlayerSummary(playerId: string) {
  const [player, setPlayer] = useState<PlayerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlayer() {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('name, image_url')
        .eq('id', playerId)
        .single();

      if (!isMounted) return;

      setPlayer(error || !data ? null : { name: data.name, imageUrl: data.image_url });
      setLoading(false);
    }

    fetchPlayer();

    return () => {
      isMounted = false;
    };
  }, [playerId]);

  return { player, loading };
}