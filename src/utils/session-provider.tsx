import { clearCachedTeamsList, prefetchTeamsList } from '@/components/teams/hooks/use-teams-list.hook';
import { clearCachedProfile, prefetchCurrentProfile } from '@/hooks/use-current-profile.hook';
import { usePresence } from '@/hooks/use-presence.hook';
import { PREFETCH_AVATARS_ENABLED } from '@/utils/prefetch-queue';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { supabase } from './supabase';

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  markPasswordRecovery: () => void;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoading: true,
  isPasswordRecovery: false,
  markPasswordRecovery: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
        if (session) {
          prefetchCurrentProfile();
          if (PREFETCH_AVATARS_ENABLED) prefetchTeamsList();
        }
      })
      .catch((error) => {
        console.error('getSession failed:', error);
        setSession(null);
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        clearCachedProfile();
        clearCachedTeamsList();
      }
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        prefetchCurrentProfile();
        if (PREFETCH_AVATARS_ENABLED) prefetchTeamsList();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  usePresence(session && !isPasswordRecovery ? session.user.id : null);

  function markPasswordRecovery() {
    setIsPasswordRecovery(true);
  }

  return (
    <SessionContext.Provider value={{ session, isLoading, isPasswordRecovery, markPasswordRecovery }}>
      {children}
    </SessionContext.Provider>
  );
}