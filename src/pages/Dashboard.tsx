import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, MAX_STORAGE_BYTES, formatFileSize } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload, Download, Trash2, LogOut, HardDrive, Shield, Search, MessageCircle,
} from 'lucide-react';
import { FilePreview, getFileIcon } from '@/components/FilePreview';
import { AudioPlayer } from '@/components/AudioPlayer';
import { BoostAnimation } from '@/components/BoostAnimation';
import { SystemIndicators } from '@/components/SystemIndicators';
import { Input } from '@/components/ui/input';
import AdminPanel from '@/components/AdminPanel';
import { Settings } from '@/components/Settings';
import { Settings as SettingsIcon } from 'lucide-react';

interface FileItem {
  name: string;
  size: number;
  created_at: string;
  id: string;
  file_type?: string;
  is_media?: boolean;
}

const BUCKET = 'lomba-drive';

import type { Session } from '@supabase/supabase-js';

interface DashboardProps {
  onLogout: () => void;
  session: Session;
}

const Dashboard = ({ onLogout, session }: DashboardProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioTrack, setAudioTrack] = useState<{ url: string; title: string } | null>(null);
  const [ramBoosted, setRamBoosted] = useState(() => localStorage.getItem('lomba_ram_boost') === '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [userMatricule, setUserMatricule] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      setShowAdmin(true);
      return;
    }
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('matricule').eq('id', session.user.id).single();
      if (data?.matricule) setUserMatricule(data.matricule);
    };
    fetchProfile();
  }, [session.user.id]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAudioTrack({ url: detail.url, title: detail.title });
    };
    window.addEventListener('lomba-play-audio', handler);
    return () => window.removeEventListener('lomba-play-audio', handler);
  }, []);

  const userFolder = `user_${session.user.id}`;

  const fetchQuota = useCallback(async () => {
    const { data } = await supabase
      .from('user_quotas')
      .select('used_storage, total_limit')
      .eq('user_id', session.user.id)
      .single();
    if (data) {
      setTotalUsed(data.used_storage);
    }
  }, [session.user.id]);

  const fetchFiles = useCallback(async () => {
    // Fetch from files table (indexed metadata)
    const { data: dbFiles } = await supabase
      .from('files')
      .select('id, file_name, file_path, file_size, file_type, is_media, created_at')
      .eq('user_id', session.user.id)
      .order('file_size', { ascending: false });

    if (dbFiles && dbFiles.length > 0) {
      const items: FileItem[] = dbFiles.map((f: any) => ({
        name: f.file_name,
        size: f.file_size,
        created_at: f.created_at,
        id: f.id,
        file_type: f.file_type,
        is_media: f.is_media,
      }));
      setFiles(items);
    } else {
      // Fallback: list from storage directly
      const { data, error } = await supabase.storage.from(BUCKET).list(userFolder, {
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) { console.error(error); return; }
      const items: FileItem[] = (data || [])
        .filter((f) => f.name && f.id)
        .map((f) => ({ name: f.name, size: f.metadata?.size || 0, created_at: f.created_at || '', id: f.id || f.name }));
      items.sort((a, b) => b.size - a.size);
      setFiles(items);
    }
    fetchQuota();
  }, [userFolder, session.user.id, fetchQuota]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const fileArr = Array.from(fileList);
    const total = fileArr.length;
    let completed = 0;

    // Upload up to 3 files in parallel for speed
    const CONCURRENCY = 3;
    const uploadOne = async (file: File) => {
      if (totalUsed + file.size > MAX_STORAGE_BYTES) {
        toast({ title: 'Espace insuffisant', description: `Pas assez d'espace pour ${file.name}`, variant: 'destructive' });
        return;
      }
      const filePath = `${userFolder}/${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: true });
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        // Register in DB (fire and forget for speed, trigger handles quota)
        supabase.from('files').insert({
          user_id: session.user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        } as any).then(() => {});
        toast({ title: 'Diarrama ! Fichier sécurisé.', description: file.name });
      }
      completed++;
      setUploadProgress(Math.round((completed / total) * 100));
    };

    // Process in batches of CONCURRENCY
    for (let i = 0; i < fileArr.length; i += CONCURRENCY) {
      const batch = fileArr.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(uploadOne));
    }

    setUploading(false);
    setUploadProgress(0);
    // Small delay to let DB triggers complete
    setTimeout(() => fetchFiles(), 500);
  };

  const handleDownload = async (name: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${userFolder}/${name}`);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (name: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([`${userFolder}/${name}`]);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      // Also remove from files table (triggers quota decrease)
      await supabase.from('files').delete().eq('user_id', session.user.id).eq('file_name', name);
      toast({ title: 'Fichier supprimé', description: name });
      fetchFiles();
    }
  };

  const usedPercent = Math.min((totalUsed / MAX_STORAGE_BYTES) * 100, 100);
  const totalUsedGb = totalUsed / (1024 * 1024 * 1024);
  const filteredFiles = searchQuery
    ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleLogoTap}>
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">
            <span className="text-primary">Lomba</span>{' '}
            <span className="text-secondary">Drive</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {userMatricule && (
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{userMatricule}</span>
          )}
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{session.user.email}</span>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <SettingsIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
        {/* System Indicators */}
        <SystemIndicators ramBoosted={ramBoosted} cloudUsedGb={totalUsedGb} />

        {/* Storage Progress */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Stockage Cloud</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(totalUsed)} / 10 010 Go
              </span>
            </div>
            <Progress value={usedPercent} className="h-3 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-secondary" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{files.length} fichier{files.length !== 1 ? 's' : ''}</span>
              <span>{formatFileSize(MAX_STORAGE_BYTES - totalUsed)} restant</span>
            </div>
          </CardContent>
        </Card>

        {/* RAM Boost */}
        {!ramBoosted && (
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <BoostAnimation onComplete={() => { setRamBoosted(true); localStorage.setItem('lomba_ram_boost', '1'); }} />
            </CardContent>
          </Card>
        )}

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
          {uploading ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Envoi en cours... {uploadProgress}%</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">Glissez vos fichiers ici</p>
              <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
            </>
          )}
          <Button
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            disabled={uploading}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            📤 Nabde (Upload)
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fichier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* File List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Fichiers ({filteredFiles.length})
          </h2>
          {filteredFiles.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {searchQuery ? 'Aucun résultat.' : 'Aucun fichier. Utilisez Nabde pour commencer.'}
            </p>
          ) : (
            filteredFiles.map((file) => (
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
                  <FilePreview fileName={file.name} userId={session.user.id} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {audioTrack && (
        <AudioPlayer src={audioTrack.url} title={audioTrack.title} onClose={() => setAudioTrack(null)} />
      )}

      {/* WhatsApp Help */}
      <a
        href="https://wa.me/221782193606"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-secondary flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-colors"
        title="Besoin d'aide ?"
      >
        <MessageCircle className="w-6 h-6 text-secondary-foreground" />
      </a>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      <Settings open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default Dashboard;
