import { useState, useEffect, useCallback } from 'react';
import { supabase, MAX_STORAGE_BYTES, formatFileSize } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload, Download, Trash2, LogOut, HardDrive, Shield,
} from 'lucide-react';
import { useRef } from 'react';
import { FilePreview, getFileIcon } from '@/components/FilePreview';

interface FileItem {
  name: string;
  size: number;
  created_at: string;
  id: string;
}

const BUCKET = 'lomba-drive';

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <FileVideo className="w-5 h-5 text-primary" />;
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt'].includes(ext)) return <FileText className="w-5 h-5 text-secondary" />;
  if (['apk', 'exe', 'dmg', 'zip', 'rar', '7z', 'tar'].includes(ext)) return <Package className="w-5 h-5 text-primary" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    const { data, error } = await supabase.storage.from(BUCKET).list('files', {
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
    // Sort by size descending
    items.sort((a, b) => b.size - a.size);
    setFiles(items);
    setTotalUsed(items.reduce((sum, f) => sum + f.size, 0));
  }, []);

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
      const { error } = await supabase.storage.from(BUCKET).upload(`files/${file.name}`, file, { upsert: true });
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
    const { data, error } = await supabase.storage.from(BUCKET).download(`files/${name}`);
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
    const { error } = await supabase.storage.from(BUCKET).remove([`files/${name}`]);
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
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">
            <span className="text-primary">Lomba</span>{' '}
            <span className="text-secondary">Drive</span>
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('lomba_auth'); onLogout(); }}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Storage Progress */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Stockage</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(totalUsed)} / 30 GB
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
                <CardContent className="p-3 flex items-center gap-3">
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
