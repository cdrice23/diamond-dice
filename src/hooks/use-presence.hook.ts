import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

export function usePresence(profileId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const channel = supabase.channel('online-users', {
      config: { presence: { key: profileId } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          profile_id: profileId,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [profileId]);
}