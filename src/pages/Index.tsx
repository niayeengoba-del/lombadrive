import { useAuth } from '@/hooks/useAuth';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import Auth from './Auth';
import Dashboard from './Dashboard';

const Index = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  useSessionTracker(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-lg animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSignIn={signIn} onSignUp={signUp} />;
  }

  return <Dashboard user={user} onLogout={signOut} />;
};

export default Index;
