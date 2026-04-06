
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS matricule text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE OR REPLACE FUNCTION public.generate_matricule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_matricule text;
  seq_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(matricule FROM 5) AS integer)), 0) + 1
  INTO seq_num
  FROM public.profiles
  WHERE matricule IS NOT NULL;
  
  new_matricule := 'LMB-' || LPAD(seq_num::text, 6, '0');
  NEW.matricule := new_matricule;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_generate_matricule ON public.profiles;
CREATE TRIGGER tr_generate_matricule
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.matricule IS NULL)
  EXECUTE FUNCTION public.generate_matricule();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'email', NEW.email), NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
CREATE POLICY "Admin can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());
