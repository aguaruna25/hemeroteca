DROP POLICY IF EXISTS "anyone can submit request" ON public.magazine_requests;
CREATE POLICY "anyone can submit request" ON public.magazine_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(btrim(description)) BETWEEN 1 AND 2000
  AND (image_path IS NULL OR image_path ~ '^[0-9a-f-]{36}\.[A-Za-z0-9]{1,5}$')
);
DROP POLICY IF EXISTS "anyone upload request images" ON storage.objects;
CREATE POLICY "anyone upload request images" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'requests'
  AND name ~ '^[0-9a-f-]{36}\.[A-Za-z0-9]{1,5}$'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif','avif','heic')
);