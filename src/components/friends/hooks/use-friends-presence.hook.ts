import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export function useFriendsPresence() {
  const [onlineProfileIds, setOnlineProfileIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineProfileIds(new Set(Object.keys(state)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return onlineProfileIds;
}