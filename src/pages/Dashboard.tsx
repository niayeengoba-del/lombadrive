import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, MAX_STORAGE_BYTES, formatFileSize } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Download, Trash2, LogOut, HardDrive, Shield } from 'lucide-react';
import { FilePreview, getFileIcon } from '@/components/FilePreview';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AdminPanel } from '@/components/AdminPanel';
import type { User } from '@supabase/supabase-js';

interface FileItem {
  name: string;
  size: number;
  created_at: string;
  id: string;
}

const BUCKET = 'lomba-drive';

const Dashboard = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioTrack, setAudioTrack] = useState<{ url: string; title: string } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 7-tap logo detection
  const tapTimesRef = useRef<number[]>([]);

  const handleLogoTap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    // Keep only last 7 taps
    if (tapTimesRef.current.length > 7) {
      tapTimesRef.current = tapTimesRef.current.slice(-7);
    }
    if (tapTimesRef.current.length === 7) {
      const elapsed = now - tapTimesRef.current[0];
      if (elapsed < 3000) { // 7 taps within 3 seconds
        tapTimesRef.current = [];
        if (isAdmin) {
          setShowAdmin(true);
        } else {
          toast({ title: 'Accès refusé', description: 'Vous n\'êtes pas administrateur.', variant: 'destructive' });
        }
      }
    }
  }, [isAdmin]);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user.id]);

  // User-scoped file path
  const userPath = `users/${user.id}`;

  // Listen for audio play events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAudioTrack({ url: detail.url, title: detail.title });
    };
    window.addEventListener('lomba-play-audio', handler);
    return () => window.removeEventListener('lomba-play-audio', handler);
  }, []);

  const fetchFiles = useCallback(async () => {
    const { data, error } = await supabase.storage.from(BUCKET).list(userPath, {
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      console.error('Error fetching files:', error);
      return;
    }
    const items: FileItem[] = (data || [])
      .filter((f) => f.name && f.id)
      .map((f) => ({
        name: f.name,
        size: f.metadata?.size || 0,
        created_at: f.created_at || '',
        id: f.id || f.name,
      }));
    items.sort((a, b) => b.size - a.size);
    setFiles(items);
    setTotalUsed(items.reduce((sum, f) => sum + f.size, 0));
  }, [userPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      if (totalUsed + file.size > MAX_STORAGE_BYTES) {
        toast({ title: 'Espace insuffisant', description: `Pas assez d'espace pour ${file.name}`, variant: 'destructive' });
        continue;
      }
      const { error } = await supabase.storage.from(BUCKET).upload(`${userPath}/${file.name}`, file, { upsert: true });
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Diarrama ! Fichier sécurisé.', description: file.name });
      }
    }

    setUploading(false);
    fetchFiles();
  };

  const handleDownload = async (name: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${userPath}/${name}`);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (name: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([`${userPath}/${name}`]);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fichier supprimé', description: name });
      fetchFiles();
    }
  };

  const usedPercent = Math.min((totalUsed / MAX_STORAGE_BYTES) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={handleLogoTap}
        >
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">
            <span className="text-primary">Lomba</span>{' '}
            <span className="text-secondary">Drive</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Storage Progress */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Stockage Cloud</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(totalUsed)} / 5000 GB
              </span>
            </div>
            <Progress value={usedPercent} className="h-3 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-secondary" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{files.length} fichier{files.length !== 1 ? 's' : ''}</span>
              <span>{formatFileSize(MAX_STORAGE_BYTES - totalUsed)} restant</span>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium">
            {uploading ? 'Envoi en cours...' : 'Glissez vos fichiers ici'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
          <Button
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            disabled={uploading}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            📤 Nabde (Upload)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {/* File List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Fichiers ({files.length})
          </h2>
          {files.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Aucun fichier. Utilisez Nabde pour commencer.</p>
          ) : (
            files.map((file) => (
              <Card key={file.id} className="bg-card border-border">
                <CardContent className="p-3 space-y-0">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary hover:text-secondary" onClick={() => handleDownload(file.name)} title="Jippinde (Download)">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(file.name)} title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <FilePreview fileName={file.name} storagePath={userPath} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Audio Player */}
      {audioTrack && (
        <AudioPlayer
          src={audioTrack.url}
          title={audioTrack.title}
          onClose={() => setAudioTrack(null)}
        />
      )}

      {/* Admin Panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default Dashboard;
