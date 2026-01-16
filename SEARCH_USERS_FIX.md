# 🔴 Sửa lỗi không tìm thấy bạn bè

## ❓ Vấn đề

Khi search users trong FriendsScreen, không tìm thấy kết quả nào, mặc dù user đã tồn tại trong database.

## 🔍 Nguyên nhân

**RLS Policy chặn việc search users khác:**
- RLS policy hiện tại chỉ cho phép user xem profile của **chính mình** (`auth.uid() = id`)
- Khi search users khác, RLS policy chặn query → trả về mảng rỗng `[]`
- Request thành công (200 OK) nhưng không có data do RLS

## ✅ Đã sửa

### 1. Thêm RLS Policy mới (`supabase-schema.sql`)

Thêm policy cho phép authenticated users search/view users khác:

```sql
CREATE POLICY "Users can search other users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

**Giải thích:**
- `auth.uid() IS NOT NULL`: Chỉ cần user đã đăng nhập (authenticated)
- Policy này cho phép user search và xem profiles của users khác
- Vẫn giữ policy cũ để user có thể update profile của chính mình

### 2. Tạo file SQL fix (`fix-users-search-policy.sql`)

File này để chạy nhanh trong Supabase SQL Editor nếu chưa chạy schema mới.

## 🎯 Cách sửa

### Cách 1: Chạy SQL Fix (NHANH NHẤT)

1. **Vào Supabase Dashboard**:
   - https://supabase.com/dashboard
   - Chọn project của bạn

2. **Vào SQL Editor**:
   - Click "SQL Editor" ở menu bên trái
   - Click "New query"

3. **Chạy fix script**:
   - Copy toàn bộ nội dung từ file `fix-users-search-policy.sql`
   - Paste vào SQL Editor
   - Click "Run" hoặc nhấn `Ctrl+Enter`

4. **Kiểm tra**:
   - Vào "Authentication" → "Policies"
   - Kiểm tra table `users` có policy "Users can search other users" chưa

### Cách 2: Chạy lại Schema đầy đủ

Nếu bạn muốn chạy lại toàn bộ schema (đã được cập nhật):

1. **Vào SQL Editor** trong Supabase Dashboard
2. **Copy toàn bộ** nội dung từ `supabase-schema.sql` (đã được cập nhật)
3. **Paste và Run**

## 🎯 Kết quả

Sau khi chạy fix:
- ✅ User có thể search users khác bằng email hoặc username
- ✅ Search sẽ trả về kết quả thay vì mảng rỗng
- ✅ User có thể gửi friend request cho users khác

## 📝 Lưu ý

- Policy mới chỉ cho phép **SELECT** (xem), không cho phép UPDATE/DELETE
- User vẫn chỉ có thể UPDATE profile của chính mình
- Nếu vẫn không tìm thấy, kiểm tra:
  1. User đã đăng nhập chưa (`auth.uid() IS NOT NULL`)
  2. Query string có đúng format không (email hoặc username)
  3. User có tồn tại trong database không

## 🔒 Bảo mật

Policy này an toàn vì:
- Chỉ cho phép **SELECT** (read-only)
- Không cho phép UPDATE/DELETE users khác
- User vẫn chỉ có thể update profile của chính mình
- Có thể thêm giới hạn nếu cần (ví dụ: chỉ hiển thị email, không hiển thị thông tin nhạy cảm)

