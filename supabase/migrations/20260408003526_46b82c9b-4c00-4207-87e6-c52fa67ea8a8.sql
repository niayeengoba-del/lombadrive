
-- 1. Create files table for metadata indexing
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  is_media boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own files"
ON public.files FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own files"
ON public.files FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own files"
ON public.files FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 2. Create user_quotas table
CREATE TABLE public.user_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  used_storage bigint NOT NULL DEFAULT 0,
  total_limit bigint NOT NULL DEFAULT 10010000000000
);

ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quota"
ON public.user_quotas FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quota"
ON public.user_quotas FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quota"
ON public.user_quotas FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Admin can read all quotas
CREATE POLICY "Admin can read all quotas"
ON public.user_quotas FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Auto-indexing trigger: extract file_type and is_media on INSERT
CREATE OR REPLACE FUNCTION public.auto_index_file()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ext text;
BEGIN
  ext := lower(reverse(split_part(reverse(NEW.file_name), '.', 1)));
  NEW.file_type := ext;
  IF ext IN ('mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma') THEN
    NEW.is_media := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_index_file
BEFORE INSERT ON public.files
FOR EACH ROW EXECUTE FUNCTION public.auto_index_file();

-- 4. Quota update trigger: add file_size to used_storage on INSERT
CREATE OR REPLACE FUNCTION public.update_quota_on_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id, used_storage)
  VALUES (NEW.user_id, NEW.file_size)
  ON CONFLICT (user_id)
  DO UPDATE SET used_storage = user_quotas.used_storage + NEW.file_size;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_quota_on_upload
AFTER INSERT ON public.files
FOR EACH ROW EXECUTE FUNCTION public.update_quota_on_upload();

-- 5. Quota decrease on DELETE
CREATE OR REPLACE FUNCTION public.update_quota_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_quotas
  SET used_storage = GREATEST(used_storage - OLD.file_size, 0)
  WHERE user_id = OLD.user_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_update_quota_on_delete
AFTER DELETE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.update_quota_on_delete();
