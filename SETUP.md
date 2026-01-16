# Hướng dẫn thiết lập Locket App

## 1. Cấu hình Supabase

### Tạo Storage Buckets

Bạn cần tạo các storage buckets sau trong Supabase Dashboard:

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Storage** > **Buckets**
4. Tạo các buckets sau:
   - `photos` - Public bucket cho ảnh
   - `thumbnails` - Public bucket cho thumbnail
   - `videos` - Public bucket cho video (nếu cần)
   - `voices` - Public bucket cho voice (nếu cần)

### Cấu hình Storage Policies

Cho mỗi bucket, bạn cần thêm policies:

**Policy cho upload:**
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy cho read:**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');
```

Lặp lại cho các buckets khác (`thumbnails`, `videos`, `voices`).

### Chạy Database Schema

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy nội dung từ file `supabase-schema.sql`
3. Chạy script để tạo tables và policies

## 2. Cài đặt Dependencies

```bash
npm install
```

## 3. Chạy App

```bash
# Development
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 4. Tính năng đã được triển khai

✅ Authentication (Login/Signup)
✅ Home Screen với photo grid
✅ Camera Screen với chức năng:
   - Chụp ảnh
   - Chọn từ thư viện
   - Thêm caption
   - Chọn bạn bè để gửi
   - Story mode
✅ Friends Screen:
   - Tìm kiếm bạn bè
   - Gửi yêu cầu kết bạn
   - Chấp nhận/từ chối yêu cầu
   - Xóa bạn bè
✅ Stories Screen:
   - Xem stories từ bạn bè
   - Stories tự động hết hạn sau 24h
✅ Settings Screen:
   - Xem thông tin profile
   - Cài đặt widget
   - Logout
✅ Photo Components:
   - PhotoCard để hiển thị ảnh
   - PhotoDetail với reactions
✅ Navigation với Bottom Tabs
✅ Notification Service (cần cấu hình thêm)

## 5. Tính năng còn thiếu (có thể phát triển thêm)

- Photo Dump feature
- Widget components cho home screen
- Push notifications đầy đủ
- Video recording
- Voice messages
- Real-time updates với Supabase Realtime

## 6. Lưu ý

- Đảm bảo đã tạo các storage buckets trước khi upload ảnh
- Kiểm tra RLS policies đã được thiết lập đúng
- API key đã được cấu hình trong `src/services/api/supabase.ts`

