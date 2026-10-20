CREATE TABLE public.magazine_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  image_path text CHECK (image_path IS NULL OR char_length(image_path) < 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.magazine_requests TO anon, authenticated;
GRANT SELECT, DELETE ON public.magazine_requests TO authenticated;
GRANT ALL ON public.magazine_requests TO service_role;
ALTER TABLE public.magazine_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit request" ON public.magazine_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin read requests" ON public.magazine_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete requests" ON public.magazine_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "anyone upload request images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'requests');
CREATE POLICY "admin read request images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'requests' AND public.has_role(auth.uid(), 'admin'));