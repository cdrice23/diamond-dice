import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  function markPasswordRecovery() {
    setIsPasswordRecovery(true);
  }

  return (
    <SessionContext.Provider value={{ session, isLoading, isPasswordRecovery, markPasswordRecovery }}>
      {children}
    </SessionContext.Provider>
  );
}