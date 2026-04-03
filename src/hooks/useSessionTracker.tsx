import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useSessionTracker(user: User | null) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create a new session
    const createSession = async () => {
      const { data } = await supabase
        .from('user_sessions')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      if (data) sessionIdRef.current = data.id;
    };

    createSession();

    // Heartbeat every 30 seconds
    const interval = setInterval(async () => {
      if (sessionIdRef.current) {
        await supabase
          .from('user_sessions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', sessionIdRef.current);
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      if (sessionIdRef.current) {
        supabase
          .from('user_sessions')
          .update({ is_active: false, last_seen_at: new Date().toISOString() })
          .eq('id', sessionIdRef.current);
      }
    };
  }, [user]);
}
