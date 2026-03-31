-- Create storage bucket for Lomba Drive
INSERT INTO storage.buckets (id, name, public)
VALUES ('lomba-drive', 'lomba-drive', false);

-- Allow anyone to upload (PIN-based auth, no Supabase auth)
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'lomba-drive');

-- Allow anyone to read
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT USING (bucket_id = 'lomba-drive');

-- Allow anyone to delete
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'lomba-drive');