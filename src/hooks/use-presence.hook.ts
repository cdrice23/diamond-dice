import { acquirePresenceChannel, releasePresenceChannel, whenPresenceSubscribed } from '@/utils/presence-channel';
import { useEffect } from 'react';

export function usePresence(profileId: string | null) {
  useEffect(() => {
    if (!profileId) {
      return;
    }

    const channel = acquirePresenceChannel();
    let cancelled = false;

    whenPresenceSubscribed(() => {
      if (!cancelled) {
        channel.track({
          profile_id: profileId,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      cancelled = true;
      channel.untrack();
      releasePresenceChannel();
    };
  }, [profileId]);
}