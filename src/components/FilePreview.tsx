import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileVideo, FileText, Package, File, Music, Eye } from 'lucide-react';

const BUCKET = 'lomba-drive';

function getFileType(name: string): 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'archive' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) return 'document';
  if (['apk', 'exe', 'dmg', 'zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'other';
}

export function getFileIcon(name: string) {
  const type = getFileType(name);
  switch (type) {
    case 'video': return <FileVideo className="w-5 h-5 text-primary" />;
    case 'audio': return <Music className="w-5 h-5 text-primary" />;
    case 'pdf':
    case 'document': return <FileText className="w-5 h-5 text-secondary" />;
    case 'archive': return <Package className="w-5 h-5 text-primary" />;
    default: return <File className="w-5 h-5 text-muted-foreground" />;
  }
}

interface FilePreviewProps {
  fileName: string;
  userId?: string;
}

export function FilePreview({ fileName, userId }: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const type = getFileType(fileName);

  useEffect(() => {
    const previewable: typeof type[] = ['image', 'video', 'audio', 'pdf', 'document'];
    if (previewable.includes(type)) {
      const folder = userId ? `user_${userId}` : 'files';
      supabase.storage
        .from(BUCKET)
        .createSignedUrl(`${folder}/${fileName}`, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setUrl(data.signedUrl);
        });
    }
  }, [fileName, type, userId]);

  if (!url) return null;

  // Images: always show inline
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

  // Video: inline player
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

  // Audio: play button
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

  // PDF: toggle inline viewer
  if (type === 'pdf') {
    return (
      <div className="mt-2 space-y-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors text-sm text-secondary font-medium w-full"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? '▼ Masquer' : '▶ Lire'} — {fileName.replace(/\.[^/.]+$/, '')}
        </button>
        {showPreview && (
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              src={url}
              className="w-full h-[70vh] bg-black/10"
              title={fileName}
            />
          </div>
        )}
      </div>
    );
  }

  // Documents (Word, Excel, PPT, TXT): use Google Docs Viewer for Office files, or open directly for TXT/CSV
  if (type === 'document') {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isPlainText = ['txt', 'csv'].includes(ext);
    const viewerUrl = isPlainText
      ? url
      : `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

    return (
      <div className="mt-2 space-y-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors text-sm text-secondary font-medium w-full"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? '▼ Masquer' : '▶ Lire'} — {fileName.replace(/\.[^/.]+$/, '')}
        </button>
        {showPreview && (
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              src={viewerUrl}
              className="w-full h-[70vh] bg-white"
              title={fileName}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
