# 🔴 Sửa lỗi RLS Policy - 403 Forbidden

## ❓ Vấn đề

Khi upload ảnh hoặc getCurrentUser(), bạn gặp lỗi:
- **403 Forbidden**: "new row violates row-level security policy for table \"users\""
- **Foreign Key Constraint**: "Key is not present in table \"users\""

## 🔍 Nguyên nhân

1. **Thiếu INSERT policy** cho table `users`
   - RLS chỉ cho phép SELECT và UPDATE
   - Không cho phép INSERT, nên không thể tạo user profile

2. **User profile chưa được tạo tự động**
   - User đã đăng nhập (có trong `auth.users`)
   - Nhưng chưa có trong `public.users`
   - Khi upload photo, foreign key constraint fail vì `user_id` không tồn tại

## ✅ Giải pháp

### Cách 1: Chạy SQL Fix (NHANH NHẤT)

1. **Vào Supabase Dashboard**:
   - https://supabase.com/dashboard
   - Chọn project của bạn

2. **Vào SQL Editor**:
   - Click "SQL Editor" ở menu bên trái
   - Click "New query"

3. **Chạy fix script**:
   - Copy toàn bộ nội dung từ file `fix-rls-policy.sql`
   - Paste vào SQL Editor
   - Click "Run" hoặc nhấn `Ctrl+Enter`

4. **Kiểm tra**:
   - Vào "Table Editor" → table `users`
   - Kiểm tra user của bạn đã có trong table chưa

### Cách 2: Chạy lại Schema đầy đủ

Nếu bạn muốn chạy lại toàn bộ schema (đã được cập nhật):

1. **Vào SQL Editor** trong Supabase Dashboard
2. **Copy toàn bộ** nội dung từ `supabase-schema.sql` (đã được cập nhật)
3. **Paste và Run**

## 🎯 Kết quả

Sau khi chạy fix:
- ✅ User có thể tự tạo profile của mình (INSERT policy)
- ✅ Profile tự động được tạo khi signup (trigger)
- ✅ Các user cũ sẽ được tạo profile tự động
- ✅ Upload photo sẽ hoạt động bình thường

## 📝 Lưu ý

- Script sẽ tự động tạo profile cho các user đã tồn tại
- Nếu user đã có profile, sẽ không bị duplicate (ON CONFLICT DO NOTHING)
- Trigger sẽ tự động tạo profile cho user mới trong tương lai

