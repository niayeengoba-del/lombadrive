import { useState } from 'react';
import { Shield, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface AuthProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

const Auth = ({ onSignIn, onSignUp }: AuthProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    if (isSignUp) {
      const { error } = await onSignUp(email, password);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Diarrama !', description: 'Vérifiez votre email pour confirmer votre compte.' });
      }
    } else {
      const { error } = await onSignIn(email, password);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Diarrama !', description: 'Bienvenue sur Lomba Virtual Drive.' });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center border border-border">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Lomba</span>{' '}
            <span className="text-secondary">Virtual Drive</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? 'Créez votre compte pour sécuriser vos fichiers' : 'Connectez-vous pour accéder à vos fichiers'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              autoFocus
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Chargement...' : isSignUp ? (
              <><UserPlus className="w-4 h-4 mr-2" /> Créer un compte</>
            ) : (
              <><LogIn className="w-4 h-4 mr-2" /> Se connecter</>
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Stockage sécurisé • 5000 GB Cloud
        </p>
      </div>
    </div>
  );
};

export default Auth;
