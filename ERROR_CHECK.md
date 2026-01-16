# Kiểm tra lỗi và sửa chữa

## ✅ Đã sửa

1. **Navigation từ Tab Navigator đến Stack Navigator**
   - Sửa cách navigate từ HomeScreen và StoriesScreen đến Camera screen
   - Sử dụng `navigation.getParent()` để truy cập Stack Navigator

## 🔍 Các lỗi có thể gặp khi chạy app

### 1. Lỗi Supabase Connection
**Triệu chứng**: "Failed to fetch" hoặc "Network error"
**Nguyên nhân**: 
- Supabase URL hoặc API key sai
- Không có kết nối internet
**Giải pháp**: 
- Kiểm tra `src/services/api/supabase.ts`
- Kiểm tra kết nối internet

### 2. Lỗi Storage Bucket
**Triệu chứng**: "Bucket not found" khi upload ảnh
**Nguyên nhân**: Chưa tạo storage buckets
**Giải pháp**: 
- Tạo buckets `photos` và `thumbnails` trong Supabase Dashboard
- Xem `QUICK_SETUP.md`

### 3. Lỗi Database Table
**Triệu chứng**: "Table does not exist" hoặc "relation does not exist"
**Nguyên nhân**: Chưa chạy database schema
**Giải pháp**: 
- Chạy `supabase-schema.sql` trong Supabase SQL Editor
- Xem `QUICK_SETUP.md`

### 4. Lỗi Permission
**Triệu chứng**: "Permission denied" khi upload ảnh
**Nguyên nhân**: Chưa thiết lập storage policies
**Giải pháp**: 
- Chạy `storage-policies.sql` trong Supabase SQL Editor
- Xem `QUICK_SETUP.md`

### 5. Lỗi RLS Policy
**Triệu chứng**: "RLS policy violation" hoặc "new row violates row-level security policy"
**Nguyên nhân**: RLS policies chưa được thiết lập đúng
**Giải pháp**: 
- Kiểm tra RLS đã được bật cho tất cả tables
- Kiểm tra policies trong `supabase-schema.sql` đã được tạo

### 6. Lỗi Camera Permission
**Triệu chứng**: Camera không hoạt động
**Nguyên nhân**: Chưa cấp quyền camera
**Giải pháp**: 
- Cấp quyền camera trong app settings
- Kiểm tra `app.json` có cấu hình permissions

### 7. Lỗi TypeScript
**Triệu chứng**: Type errors khi build
**Nguyên nhân**: Type definitions không đúng
**Giải pháp**: 
- Chạy `npx tsc --noEmit` để kiểm tra
- Sửa các type errors

### 8. Lỗi Navigation
**Triệu chứng**: "The action 'NAVIGATE' with payload ... was not handled"
**Nguyên nhân**: Screen chưa được đăng ký trong Navigator
**Giải pháp**: 
- Kiểm tra `App.tsx` đã đăng ký tất cả screens
- Kiểm tra tên screen phải khớp

## 🧪 Cách kiểm tra

### 1. Kiểm tra TypeScript
```bash
npx tsc --noEmit
```

### 2. Kiểm tra Dependencies
```bash
npm install
```

### 3. Kiểm tra Supabase Connection
- Mở app
- Thử đăng ký user mới
- Nếu lỗi, kiểm tra Supabase credentials

### 4. Kiểm tra Storage
- Đăng nhập
- Thử upload ảnh
- Nếu lỗi "Bucket not found", tạo buckets

## 📝 Checklist trước khi chạy

- [ ] Đã cài đặt dependencies (`npm install`)
- [ ] Đã tạo storage buckets trong Supabase
- [ ] Đã chạy `storage-policies.sql`
- [ ] Đã chạy `supabase-schema.sql`
- [ ] Đã kiểm tra Supabase credentials
- [ ] Đã kiểm tra TypeScript errors (`npx tsc --noEmit`)

## 🚀 Chạy app

```bash
npm start
```

Sau đó chọn platform (i/a/w)

