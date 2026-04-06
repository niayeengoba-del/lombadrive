import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Auth from './Auth';
import Dashboard from './Dashboard';
import { MatriculePopup } from '@/components/MatriculePopup';
import type { Session } from '@supabase/supabase-js';

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [matricule, setMatricule] = useState<string | null>(null);
  const [showMatricule, setShowMatricule] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(false);

      if (event === 'SIGNED_IN' && session) {
        // Check if user has seen their matricule
        const seenKey = `lomba_matricule_seen_${session.user.id}`;
        if (!localStorage.getItem(seenKey)) {
          // Fetch profile with matricule
          setTimeout(async () => {
            const { data } = await supabase
              .from('profiles')
              .select('matricule')
              .eq('id', session.user.id)
              .single();
            if (data?.matricule) {
              setMatricule(data.matricule);
              setShowMatricule(true);
              localStorage.setItem(seenKey, '1');
            }
          }, 500);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary animate-pulse text-lg">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Check if user is blocked
  return (
    <>
      {showMatricule && matricule && (
        <MatriculePopup matricule={matricule} onDone={() => setShowMatricule(false)} />
      )}
      <Dashboard onLogout={handleLogout} session={session} />
    </>
  );
};

export default Index;
