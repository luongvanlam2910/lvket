# ✅ Checklist Thiết lập Locket App

Sử dụng checklist này để đảm bảo bạn đã thiết lập đầy đủ trước khi chạy app.

## 📋 Pre-setup

- [ ] Đã cài đặt Node.js (v16+)
- [ ] Đã cài đặt npm hoặc yarn
- [ ] Đã clone/download project
- [ ] Đã chạy `npm install`

## 🔐 Supabase Setup

### Storage Buckets

- [ ] Đã tạo bucket `photos` (public)
- [ ] Đã tạo bucket `thumbnails` (public)
- [ ] Đã tạo bucket `videos` (public) - Tùy chọn
- [ ] Đã tạo bucket `voices` (public) - Tùy chọn

**Cách tạo:**
- Qua Dashboard: Storage → New bucket
- Hoặc chạy script: `node scripts/create-storage-buckets.js YOUR_SERVICE_ROLE_KEY`

### Storage Policies

- [ ] Đã chạy file `storage-policies.sql` trong Supabase SQL Editor
- [ ] Đã kiểm tra policies được tạo thành công

**Cách chạy:**
1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung `storage-policies.sql`
3. Paste và chạy (Ctrl+Enter)

### Database Schema

- [ ] Đã chạy file `supabase-schema.sql` trong Supabase SQL Editor
- [ ] Đã kiểm tra các tables được tạo:
  - [ ] `users`
  - [ ] `friendships`
  - [ ] `photos`
  - [ ] `photo_dumps`
  - [ ] `reactions`
  - [ ] `widget_settings`
- [ ] Đã kiểm tra RLS được bật cho tất cả tables

**Cách chạy:**
1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung `supabase-schema.sql`
3. Paste và chạy (Ctrl+Enter)

## ✅ Verification

### Kiểm tra Storage

- [ ] Vào Storage → Kiểm tra 2-4 buckets đã được tạo
- [ ] Kiểm tra buckets có status "Public" không

### Kiểm tra Database

- [ ] Vào Table Editor → Kiểm tra 6 tables đã được tạo
- [ ] Vào Authentication → Policies → Kiểm tra RLS đã được bật

### Kiểm tra App

- [ ] Chạy `npm start`
- [ ] App khởi động không có lỗi
- [ ] Có thể đăng ký user mới
- [ ] Có thể đăng nhập
- [ ] Có thể upload ảnh (sau khi có bạn bè)

## 🚀 Ready to Go!

Nếu tất cả các mục trên đã được check ✅, bạn đã sẵn sàng chạy app!

```bash
npm start
```

## ❓ Troubleshooting

Nếu gặp lỗi, kiểm tra:

1. **"Bucket not found"** → Chưa tạo storage buckets
2. **"Table does not exist"** → Chưa chạy database schema
3. **"Permission denied"** → Chưa chạy storage policies
4. **"RLS policy violation"** → Kiểm tra RLS policies trong schema

Xem file `setup-supabase.md` để biết hướng dẫn chi tiết.

