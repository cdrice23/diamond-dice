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

  const fetchProfile = useCallback(async () => {
    if (inFlightFetch) {
      const result = await inFlightFetch;
      setProfile(result);
      setLoading(false);
      return;
    }

    if (!cachedProfile) {
      setLoading(true);
    }

    const result = await fetchAndCacheProfile();
    setProfile(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}