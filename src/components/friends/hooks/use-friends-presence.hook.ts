import { acquirePresenceChannel, addPresenceSyncListener, getPresenceState, releasePresenceChannel } from '@/utils/presence-channel';
import { useEffect, useState } from 'react';
import { MOCK_ONLINE_PROFILE_IDS, USE_MOCK_FRIENDS_DATA } from '../friends.mock';

export function useFriendsPresence() {
  const [onlineProfileIds, setOnlineProfileIds] = useState<Set<string>>(() =>
    USE_MOCK_FRIENDS_DATA ? MOCK_ONLINE_PROFILE_IDS : new Set(Object.keys(getPresenceState()))
  );

  useEffect(() => {
    if (USE_MOCK_FRIENDS_DATA) return;

    acquirePresenceChannel();

    const removeListener = addPresenceSyncListener(() => {
      setOnlineProfileIds(new Set(Object.keys(getPresenceState())));
    });

    return () => {
      removeListener();
      releasePresenceChannel();
    };
  }, []);

  return onlineProfileIds;
}