import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileVideo, FileText, Package, File, Music } from 'lucide-react';

const BUCKET = 'lomba-drive';

function getFileType(name: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
  if (['apk', 'exe', 'dmg', 'zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'other';
}

export function getFileIcon(name: string) {
  const type = getFileType(name);
  switch (type) {
    case 'video': return <FileVideo className="w-5 h-5 text-primary" />;
    case 'audio': return <Music className="w-5 h-5 text-primary" />;
    case 'document': return <FileText className="w-5 h-5 text-secondary" />;
    case 'archive': return <Package className="w-5 h-5 text-primary" />;
    default: return <File className="w-5 h-5 text-muted-foreground" />;
  }
}

interface FilePreviewProps {
  fileName: string;
}

export function FilePreview({ fileName }: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const type = getFileType(fileName);

  useEffect(() => {
    if (type === 'image' || type === 'video' || type === 'audio') {
      supabase.storage
        .from(BUCKET)
        .createSignedUrl(`files/${fileName}`, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setUrl(data.signedUrl);
        });
    }
  }, [fileName, type]);

  if (!url) return null;

  if (type === 'image') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-border">
        <img
          src={url}
          alt={fileName}
          className="w-full max-h-48 object-contain bg-black/20"
          loading="lazy"
        />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-border">
        <video
          src={url}
          controls
          className="w-full max-h-48 bg-black"
          preload="metadata"
        />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="mt-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('lomba-play-audio', { detail: { url, title: fileName } }))}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-sm text-primary font-medium w-full"
        >
          <Music className="w-4 h-4" />
          ▶ Écouter — {fileName.replace(/\.[^/.]+$/, '')}
        </button>
      </div>
    );
  }

  return null;
}
