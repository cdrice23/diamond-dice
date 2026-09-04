import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useState } from 'react';

export type CurrentProfile = {
  id: string;
  username: string;
  displayName: string;
  autoRollEnabled: boolean;
};

let cachedProfile: CurrentProfile | null = null;
let inFlightFetch: Promise<CurrentProfile | null> | null = null;

async function fetchAndCacheProfile(): Promise<CurrentProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    cachedProfile = null;
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, auto_roll_enabled')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    cachedProfile = null;
    return null;
  }

  const next: CurrentProfile = {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    autoRollEnabled: data.auto_roll_enabled,
  };
  cachedProfile = next;
  return next;
}

export function prefetchCurrentProfile(): void {
  if (cachedProfile || inFlightFetch) return;

  inFlightFetch = fetchAndCacheProfile().finally(() => {
    inFlightFetch = null;
  });
}

export function updateCachedProfile(next: CurrentProfile) {
  cachedProfile = next;
}

export function clearCachedProfile(): void {
  cachedProfile = null;
  inFlightFetch = null;
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);
  const [refetchNonce, setRefetchNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (inFlightFetch) {
        const result = await inFlightFetch;
        if (ignore) return;
        setProfile(result);
        setLoading(false);
        return;
      }

      const result = await fetchAndCacheProfile();
      if (ignore) return;
      setProfile(result);
      setLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [refetchNonce]);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefetchNonce((prev) => prev + 1);
  }, []);

  return { profile, loading, refetch };
}