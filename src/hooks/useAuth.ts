import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Restore session DULU dari storage sebelum subscribe
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // Subscribe SETELAH restore selesai
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
              if (mounted) {
                console.log('Auth state changed:', { event: _event, hasSession: !!newSession });
                setSession(newSession);
                setUser(newSession?.user ?? null);
              }
            }
          );

          unsubscribe = subscription.unsubscribe;
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    isLoading,
    signOut,
    isAuthenticated: !!session,
  };
}
