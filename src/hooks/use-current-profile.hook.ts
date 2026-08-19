import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useState } from 'react';

export type CurrentProfile = {
  id: string;
  username: string;
  displayName: string;
  autoRollEnabled: boolean;
};

let cachedProfile: CurrentProfile | null = null;

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);

  const fetchProfile = useCallback(async () => {
    if (!cachedProfile) {
      setLoading(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      cachedProfile = null;
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, auto_roll_enabled')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      cachedProfile = null;
      setProfile(null);
    } else {
      const next: CurrentProfile = {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        autoRollEnabled: data.auto_roll_enabled,
      };
      cachedProfile = next;
      setProfile(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}

export function updateCachedProfile(next: CurrentProfile) {
  cachedProfile = next;
}