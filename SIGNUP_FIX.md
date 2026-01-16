# 🔴 Sửa lỗi đăng ký không được

## ❓ Nguyên nhân

Lỗi đăng ký có thể do:

1. **Database chưa được thiết lập** (Phổ biến nhất)
   - Table `users` chưa được tạo
   - Chưa chạy `supabase-schema.sql`

2. **Rate limiting (429)**
   - Quá nhiều requests trong thời gian ngắn
   - Đợi 2-5 phút trước khi thử lại

3. **Email đã tồn tại**
   - Email đã được đăng ký trước đó
   - Thử đăng nhập thay vì đăng ký

4. **RLS Policy chưa được thiết lập**
   - Row Level Security chưa được cấu hình đúng
   - User không có quyền insert vào table `users`

## ✅ Đã sửa

1. **Cải thiện error handling** trong `authService.ts`:
   - Phát hiện lỗi "table does not exist"
   - Hiển thị thông báo rõ ràng về database setup
   - Xử lý trường hợp profile đã tồn tại

2. **Better error messages** trong `SignUpScreen.tsx`:
   - Thông báo cụ thể cho từng loại lỗi
   - Hướng dẫn cách sửa

## 🛠️ Giải pháp

### Cách 1: Thiết lập Database (QUAN TRỌNG NHẤT)

Nếu chưa chạy database schema:

1. **Vào Supabase Dashboard**:
   - https://supabase.com/dashboard
   - Chọn project của bạn

2. **Vào SQL Editor**:
   - Click "SQL Editor" ở menu bên trái
   - Click "New query"

3. **Chạy schema**:
   - Copy toàn bộ nội dung từ file `supabase-schema.sql`
   - Paste vào SQL Editor
   - Click "Run" hoặc nhấn `Ctrl+Enter`

4. **Kiểm tra**:
   - Vào "Table Editor"
   - Kiểm tra table `users` đã được tạo chưa

### Cách 2: Đợi Rate Limit Reset

Nếu bị rate limit:

1. **Đợi 2-5 phút**
2. **Thử lại với email khác** (nếu cần test ngay)
3. **Tránh spam click** nút Sign Up

### Cách 3: Kiểm tra Email

1. **Email đã tồn tại?**
   - Thử đăng nhập thay vì đăng ký
   - Hoặc dùng email khác

2. **Email hợp lệ?**
   - Kiểm tra format email đúng chưa
   - Ví dụ: `user@example.com`

## 📝 Checklist

Trước khi đăng ký, đảm bảo:

- [ ] Đã chạy `supabase-schema.sql` trong Supabase SQL Editor
- [ ] Table `users` đã được tạo (kiểm tra trong Table Editor)
- [ ] RLS policies đã được thiết lập
- [ ] Không bị rate limit (đợi vài phút nếu cần)

## 🔍 Debug

Nếu vẫn không được:

1. **Mở DevTools (F12)**:
   - Xem Console tab để xem error chi tiết
   - Xem Network tab để xem request/response

2. **Kiểm tra Supabase Dashboard**:
   - Authentication → Users: Xem user đã được tạo chưa
   - Table Editor → users: Xem table có tồn tại không

3. **Kiểm tra error message**:
   - App sẽ hiển thị error message cụ thể
   - Làm theo hướng dẫn trong message

## 💡 Tips

- **Development**: Chạy schema trước khi test đăng ký
- **Production**: Đảm bảo database đã được setup đầy đủ
- **Test**: Dùng email khác nhau để test nhiều lần

## 🚀 Code đã được cập nhật

Error handling đã được cải thiện để:
- Phát hiện lỗi database setup
- Hiển thị message rõ ràng hơn
- Hướng dẫn user cách sửa
- Log error để debug

