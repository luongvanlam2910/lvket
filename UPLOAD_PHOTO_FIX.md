# 🔴 Sửa lỗi upload photo

## ❓ Nguyên nhân lỗi

### Lỗi 1: 406 Not Acceptable - User profile not found
**Triệu chứng**: 
- Error: `PGRST116 - The result contains 0 rows`
- `Cannot coerce the result to a single JSON object`

**Nguyên nhân**: 
- User đã đăng nhập nhưng chưa có profile trong table `users`
- User đăng ký trước khi chạy database schema
- Profile creation failed khi signup

**✅ Đã sửa**: 
- `getCurrentUser()` tự động tạo profile nếu chưa có
- Fallback về auth user nếu không tạo được profile

### Lỗi 2: Bucket not found
**Triệu chứng**: 
- Error: `Bucket not found` hoặc `Storage bucket not found`

**Nguyên nhân**: 
- Storage buckets chưa được tạo trong Supabase

**✅ Đã sửa**: 
- Error handling rõ ràng hơn
- Hướng dẫn tạo buckets

## 🛠️ Giải pháp

### Bước 1: Tạo Storage Buckets (QUAN TRỌNG)

1. **Vào Supabase Dashboard**:
   - https://supabase.com/dashboard
   - Chọn project của bạn

2. **Vào Storage**:
   - Click "Storage" ở menu bên trái
   - Click "New bucket"

3. **Tạo 2 buckets**:
   - **Bucket 1**: `photos` - Public bucket
   - **Bucket 2**: `thumbnails` - Public bucket

4. **Chạy Storage Policies**:
   - Vào SQL Editor
   - Copy nội dung từ `storage-policies.sql`
   - Paste và chạy

### Bước 2: Chạy Database Schema (Nếu chưa)

1. **Vào SQL Editor**:
   - Copy nội dung từ `supabase-schema.sql`
   - Paste và chạy

2. **Kiểm tra**:
   - Vào Table Editor
   - Kiểm tra table `users` đã được tạo

### Bước 3: Thử lại upload

1. **Refresh app** (Ctrl+R)
2. **Thử upload ảnh lại**
3. **Nếu vẫn lỗi**, xem error message cụ thể

## ✅ Đã sửa trong code

1. **getCurrentUser()**:
   - Tự động tạo user profile nếu chưa có
   - Fallback về auth user nếu không tạo được

2. **uploadPhoto()**:
   - Better error handling
   - Thông báo rõ ràng về storage buckets

3. **Error messages**:
   - Hướng dẫn cụ thể cách sửa

## 📝 Checklist

Trước khi upload ảnh:
- [ ] Đã tạo storage bucket `photos`
- [ ] Đã tạo storage bucket `thumbnails`
- [ ] Đã chạy `storage-policies.sql`
- [ ] Đã chạy `supabase-schema.sql`
- [ ] Đã đăng nhập thành công

## 🔍 Debug

Nếu vẫn lỗi:

1. **Mở DevTools (F12)** → Network tab
2. **Xem request upload**:
   - Tìm request đến storage bucket
   - Xem error message cụ thể
3. **Xem Console**:
   - Tìm log "Error uploading photo"
   - Xem error details

## 💡 Tips

- **Storage buckets phải được tạo TRƯỚC khi upload**
- **User profile sẽ tự động được tạo** khi getCurrentUser() được gọi
- **Nếu vẫn lỗi**, kiểm tra Supabase Dashboard → Storage → Buckets

