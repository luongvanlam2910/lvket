# Quick Setup Guide - Locket App

## 🚀 Thiết lập nhanh (5 phút)

### Bước 1: Tạo Storage Buckets (2 phút)

1. Mở [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project: `gjluacrkryivkjezsokt`
3. Vào **Storage** → **New bucket**

Tạo 2 buckets bắt buộc:
- ✅ `photos` - Public bucket
- ✅ `thumbnails` - Public bucket

Tạo thêm (tùy chọn):
- `videos` - Public bucket
- `voices` - Public bucket

### Bước 2: Chạy Storage Policies (1 phút)

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy nội dung file `storage-policies.sql`
3. Paste và chạy (Ctrl+Enter)

### Bước 3: Chạy Database Schema (2 phút)

1. Vẫn trong **SQL Editor**
2. Copy nội dung file `supabase-schema.sql`
3. Paste và chạy (Ctrl+Enter)

### Bước 4: Kiểm tra (30 giây)

✅ Vào **Storage** → Kiểm tra buckets đã tạo
✅ Vào **Table Editor** → Kiểm tra tables: users, friendships, photos, reactions, widget_settings

### Xong! 🎉

Bây giờ bạn có thể chạy app:
```bash
npm start
```

## 📋 Checklist

- [ ] Đã tạo bucket `photos`
- [ ] Đã tạo bucket `thumbnails`
- [ ] Đã chạy `storage-policies.sql`
- [ ] Đã chạy `supabase-schema.sql`
- [ ] Đã kiểm tra tables được tạo
- [ ] Đã kiểm tra buckets được tạo

## ❓ Cần giúp đỡ?

Xem file `setup-supabase.md` để biết hướng dẫn chi tiết hơn.

