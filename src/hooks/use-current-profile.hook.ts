import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useState } from 'react';

export type CurrentProfile = {
  id: string;
  username: string;
  displayName: string;
};

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      setProfile(null);
    } else {
      setProfile({ id: data.id, username: data.username, displayName: data.display_name });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}