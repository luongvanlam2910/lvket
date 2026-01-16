# Hướng dẫn thiết lập Supabase cho Locket App

## Bước 1: Tạo Storage Buckets

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn: `gjluacrkryivkjezsokt`
3. Vào **Storage** (menu bên trái)
4. Click **New bucket**
5. Tạo các buckets sau với cấu hình:

#### Bucket 1: `photos`
- **Name**: `photos`
- **Public bucket**: ✅ Bật (Public)
- **File size limit**: 10 MB (hoặc để mặc định)
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

#### Bucket 2: `thumbnails`
- **Name**: `thumbnails`
- **Public bucket**: ✅ Bật (Public)
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

#### Bucket 3: `videos` (Tùy chọn)
- **Name**: `videos`
- **Public bucket**: ✅ Bật (Public)
- **File size limit**: 50 MB
- **Allowed MIME types**: `video/mp4,video/quicktime`

#### Bucket 4: `voices` (Tùy chọn)
- **Name**: `voices`
- **Public bucket**: ✅ Bật (Public)
- **File size limit**: 10 MB
- **Allowed MIME types**: `audio/mpeg,audio/wav,audio/m4a`

### Cách 2: Qua Supabase CLI (Nếu có)

```bash
# Cài đặt Supabase CLI nếu chưa có
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref gjluacrkryivkjezsokt

# Tạo buckets (chạy từng lệnh)
supabase storage create photos --public
supabase storage create thumbnails --public
supabase storage create videos --public
supabase storage create voices --public
```

## Bước 2: Thiết lập Storage Policies

Sau khi tạo buckets, bạn cần thiết lập RLS policies. Chạy script SQL sau trong **SQL Editor**:

```sql
-- Storage Policies cho bucket 'photos'
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policies cho bucket 'thumbnails'
CREATE POLICY "Users can upload their own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policies cho bucket 'videos' (nếu tạo)
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Storage Policies cho bucket 'voices' (nếu tạo)
CREATE POLICY "Users can upload their own voices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view voices"
ON storage.objects FOR SELECT
USING (bucket_id = 'voices');
```

## Bước 3: Chạy Database Schema

1. Vào **SQL Editor** trong Supabase Dashboard
2. Click **New query**
3. Copy toàn bộ nội dung từ file `supabase-schema.sql`
4. Paste vào editor
5. Click **Run** hoặc nhấn `Ctrl+Enter`

Schema này sẽ tạo:
- ✅ Tables: users, friendships, photos, photo_dumps, reactions, widget_settings
- ✅ Indexes cho performance
- ✅ RLS Policies cho security
- ✅ Triggers để tự động update timestamps

## Bước 4: Kiểm tra

Sau khi hoàn thành, kiểm tra:

1. **Storage Buckets**: Vào Storage → Kiểm tra 4 buckets đã được tạo
2. **Tables**: Vào Table Editor → Kiểm tra các tables đã được tạo
3. **Policies**: Vào Authentication → Policies → Kiểm tra RLS đã được bật

## Lưu ý quan trọng

⚠️ **Storage buckets phải được tạo TRƯỚC khi chạy app**, nếu không sẽ bị lỗi khi upload ảnh.

⚠️ **Database schema phải được chạy TRƯỚC khi đăng ký user đầu tiên**, nếu không sẽ bị lỗi khi tạo profile.

## Troubleshooting

### Lỗi: "Bucket not found"
→ Kiểm tra tên bucket có đúng không (phải là `photos`, `thumbnails`, v.v.)

### Lỗi: "Permission denied"
→ Kiểm tra Storage Policies đã được tạo chưa

### Lỗi: "Table does not exist"
→ Kiểm tra database schema đã được chạy chưa

### Lỗi: "RLS policy violation"
→ Kiểm tra RLS policies trong database schema đã được tạo đúng chưa

