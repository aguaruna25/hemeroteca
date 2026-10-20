-- Ejecutar en Supabase SQL Editor una sola vez, si no se aplicaron las migraciones previas.
CREATE TABLE IF NOT EXISTS public.magazine_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
 description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 2000),
 image_path text CHECK (image_path IS NULL OR image_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp|gif)$'),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.magazine_requests ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.magazine_requests TO anon, authenticated;
GRANT SELECT, DELETE ON public.magazine_requests TO authenticated;
DROP POLICY IF EXISTS "anyone can submit request" ON public.magazine_requests;
CREATE POLICY "anyone can submit request" ON public.magazine_requests FOR INSERT TO anon, authenticated WITH CHECK (char_length(email) BETWEEN 3 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(btrim(description)) BETWEEN 1 AND 2000);
DROP POLICY IF EXISTS "admin read requests" ON public.magazine_requests;
CREATE POLICY "admin read requests" ON public.magazine_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admin delete requests" ON public.magazine_requests;
CREATE POLICY "admin delete requests" ON public.magazine_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('requests', 'requests', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']) ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880, allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "anyone upload request images" ON storage.objects;
CREATE POLICY "anyone upload request images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'requests' AND name ~ '^[0-9a-f-]{36}\.(jpg|png|webp|gif)$' AND lower(storage.extension(name)) IN ('jpg','png','webp','gif'));
DROP POLICY IF EXISTS "admin read request images" ON storage.objects;
CREATE POLICY "admin read request images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'requests' AND public.has_role(auth.uid(), 'admin'));
