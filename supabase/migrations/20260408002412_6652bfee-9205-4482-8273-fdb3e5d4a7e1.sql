-- Add RLS policies on storage.objects for lomba-drive bucket

CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lomba-drive' 
  AND (storage.foldername(name))[1] = 'user_' || auth.uid()::text
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lomba-drive' 
  AND (storage.foldername(name))[1] = 'user_' || auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lomba-drive' 
  AND (storage.foldername(name))[1] = 'user_' || auth.uid()::text
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lomba-drive' 
  AND (storage.foldername(name))[1] = 'user_' || auth.uid()::text
)
WITH CHECK (
  bucket_id = 'lomba-drive' 
  AND (storage.foldername(name))[1] = 'user_' || auth.uid()::text
);