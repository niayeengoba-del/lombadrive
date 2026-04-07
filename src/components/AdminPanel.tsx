import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { X, Shield, Ban, CheckCircle, Bell, Users, Mail, MapPin } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string | null;
  matricule: string | null;
  full_name: string | null;
  is_blocked: boolean;
  created_at: string;
  location: string | null;
}

interface AdminPanelProps {
  onClose: () => void;
}

const ADMIN_PIN = 'Trust100%';

const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  const handleAuth = () => {
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      fetchUsers();
      fetchActiveCount();
    } else {
      toast({ title: 'Accès refusé', variant: 'destructive' });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const fetchActiveCount = async () => {
    const { data } = await supabase.rpc('get_active_user_count');
    if (data !== null) setActiveCount(Number(data));
  };

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentlyBlocked })
      .eq('id', userId);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: currentlyBlocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué' });
      fetchUsers();
    }
  };

  const sendNotification = (userId: string, matricule: string | null) => {
    if (!notification.trim()) {
      toast({ title: 'Erreur', description: 'Écrivez un message', variant: 'destructive' });
      return;
    }
    // Store notification in localStorage for the target user (simple approach)
    const key = `lomba_notif_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ message: notification, date: new Date().toISOString(), from: 'admin' });
    localStorage.setItem(key, JSON.stringify(existing));
    toast({ title: 'Notification envoyée', description: `Message envoyé à ${matricule || userId}` });
    setNotification('');
    setSelectedUser(null);
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold">Admin</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
            <Input
              type="password"
              placeholder="Code admin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              className="h-12 bg-muted border-border"
              autoFocus
            />
            <Button onClick={handleAuth} className="w-full bg-primary text-primary-foreground">
              Accéder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold">Panneau Admin</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total utilisateurs</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-1">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              </div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Actifs maintenant</p>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Utilisateurs ({users.length})
        </h3>

        {loading ? (
          <p className="text-center text-muted-foreground py-4">Chargement...</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id} className={`border-border ${user.is_blocked ? 'bg-destructive/5 border-destructive/30' : 'bg-card'}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-primary font-bold">{user.matricule || 'N/A'}</span>
                        {user.is_blocked && <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">Bloqué</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm truncate">{user.email || 'Pas d\'email'}</p>
                      </div>
                      {user.full_name && <p className="text-xs text-muted-foreground">{user.full_name}</p>}
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{user.location || 'Localisation inconnue'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                        title="Envoyer notification"
                      >
                        <Bell className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleBlock(user.id, user.is_blocked)}
                        title={user.is_blocked ? 'Débloquer' : 'Bloquer'}
                      >
                        {user.is_blocked ? (
                          <CheckCircle className="w-4 h-4 text-secondary" />
                        ) : (
                          <Ban className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {selectedUser === user.id && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Message à envoyer..."
                        value={notification}
                        onChange={(e) => setNotification(e.target.value)}
                        className="h-9 bg-muted border-border text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && sendNotification(user.id, user.matricule)}
                      />
                      <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => sendNotification(user.id, user.matricule)}>
                        Envoyer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
