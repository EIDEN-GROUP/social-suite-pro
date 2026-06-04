
CREATE POLICY "Auth read media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media');
CREATE POLICY "Auth upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');
CREATE POLICY "Superadmin manage media" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'superadmin'));
