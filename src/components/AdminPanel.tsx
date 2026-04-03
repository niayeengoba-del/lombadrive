import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatFileSize } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Users, Clock, Activity } from 'lucide-react';

interface SessionInfo {
  session_id: string;
  user_id: string;
  user_email: string;
  started_at: string;
  last_seen_at: string;
  is_active: boolean;
}

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [sessionsRes, countRes] = await Promise.all([
      supabase.rpc('get_all_sessions'),
      supabase.rpc('get_active_user_count'),
    ]);

    if (sessionsRes.data) setSessions(sessionsRes.data as SessionInfo[]);
    if (countRes.data !== null) setActiveCount(Number(countRes.data));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime session changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
  };

  const uniqueUsers = new Set(sessions.map(s => s.user_id)).size;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">🔐 Panneau Admin</h1>
            <p className="text-sm text-muted-foreground">Contrôle total de la plateforme Lomba</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-xs text-muted-foreground">En ligne maintenant</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-secondary mx-auto mb-1" />
              <p className="text-2xl font-bold text-secondary">{uniqueUsers}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs total</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions total</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sessions ({sessions.length})
          </h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune session enregistrée.</p>
          ) : (
            sessions.map((s) => (
              <Card key={s.session_id} className="bg-card border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-secondary animate-pulse' : 'bg-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.user_email || 'Email inconnu'}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {s.user_id.slice(0, 8)}... • Durée: {formatDuration(s.started_at, s.last_seen_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                      {s.is_active ? '🟢 En ligne' : '⚫ Hors ligne'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
