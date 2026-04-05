import { supabase } from '@/integrations/supabase/client';

export { supabase };

export const MAX_STORAGE_BYTES = 10010 * 1024 * 1024 * 1024; // 10010GB

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
