import { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast({ title: 'Email non confirmé', description: 'Vérifiez votre boîte mail pour confirmer votre inscription.', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Diarrama !', description: 'Bienvenue sur Lomba Virtual Drive.' });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caractères.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, email },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Inscription réussie !', description: 'Vérifiez votre boîte mail pour confirmer votre compte.' });
      setMode('login');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email envoyé', description: 'Consultez votre boîte mail pour réinitialiser votre mot de passe.' });
      setMode('login');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: 'Erreur', description: String(result.error), variant: 'destructive' });
      setLoading(false);
    }
    if (result.redirected) return;
    setLoading(false);
  };

  const whatsappUrl = 'https://wa.me/221782193606';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center border border-border">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Lomba</span>{' '}
            <span className="text-secondary">Virtual Drive</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' && 'Connectez-vous à votre espace sécurisé'}
            {mode === 'signup' && 'Créez votre compte sécurisé'}
            {mode === 'forgot' && 'Réinitialisez votre mot de passe'}
          </p>
        </div>

        {/* Google Login */}
        {mode !== 'forgot' && (
          <Button
            variant="outline"
            className="w-full h-12 text-base border-border hover:bg-muted"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </Button>
        )}

        {mode !== 'forgot' && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>
        )}

        {/* Forms */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-muted border-border" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 bg-muted border-border" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12 bg-muted border-border" required />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-muted border-border" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe (min. 6 car.)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 bg-muted border-border" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Inscription...' : "S'inscrire"}
            </Button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="Votre email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-muted border-border" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </Button>
          </form>
        )}

        {/* Mode switchers */}
        <div className="space-y-2 text-center text-sm">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('forgot')} className="text-primary hover:underline block w-full">
                🔑 Mot de passe oublié ?
              </button>
              <p className="text-muted-foreground">
                Pas de compte ?{' '}
                <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                  S'inscrire
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-muted-foreground">
              Déjà un compte ?{' '}
              <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                Se connecter
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="text-primary hover:underline">
              ← Retour à la connexion
            </button>
          )}
        </div>

        {/* WhatsApp Help */}
        <div className="pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-secondary" />
            Besoin d'aide ?
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Stockage sécurisé • 10 010 Go
        </p>
      </div>
    </div>
  );
};

export default Auth;
