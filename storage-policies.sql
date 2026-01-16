-- Storage Policies cho LVket App
-- Chạy script này SAU KHI đã tạo storage buckets

-- ============================================
-- POLICIES CHO BUCKET 'photos'
-- ============================================

-- Users can upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public can view photos 
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLICIES CHO BUCKET 'thumbnails'
-- ============================================

-- Users can upload their own thumbnails
CREATE POLICY "Users can upload their own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public can view thumbnails
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Users can update their own thumbnails
CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLICIES CHO BUCKET 'videos' (Tùy chọn)
-- ============================================

-- Users can upload their own videos
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public can view videos
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLICIES CHO BUCKET 'voices' (Tùy chọn)
-- ============================================

-- Users can upload their own voices
CREATE POLICY "Users can upload their own voices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public can view voices
CREATE POLICY "Public can view voices"
ON storage.objects FOR SELECT
USING (bucket_id = 'voices');

-- Users can delete their own voices
CREATE POLICY "Users can delete their own voices"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

