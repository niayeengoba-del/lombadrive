import { useState } from 'react';
import { Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface LoginProps {
  onLogin: () => void;
}

const PIN_CODE = '08980898';

const Login = ({ onLogin }: LoginProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (pin === PIN_CODE) {
        localStorage.setItem('lomba_auth', 'true');
        toast({ title: 'Diarrama !', description: 'Bienvenue sur Lomba Virtual Drive.' });
        onLogin();
      } else {
        toast({ title: 'Erreur', description: 'Code PIN incorrect.', variant: 'destructive' });
      }
      setLoading(false);
    }, 800);
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
          <p className="text-muted-foreground text-sm">Entrez votre code PIN pour accéder à vos fichiers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Code PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="pl-10 h-12 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !pin}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-gold"
          >
            {loading ? 'Vérification...' : 'Entrer'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Stockage sécurisé • 30 GB
        </p>
      </div>
    </div>
  );
};

export default Login;
