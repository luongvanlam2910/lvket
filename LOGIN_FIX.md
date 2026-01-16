# 🔐 Sửa lỗi đăng nhập - 400 Bad Request

## ❓ Nguyên nhân lỗi 400

Lỗi **400 Bad Request** khi đăng nhập có thể do:

1. **Email chưa được verify** (Phổ biến nhất)
   - Supabase mặc định yêu cầu verify email trước khi login
   - User mới tạo cần click link trong email để verify

2. **Email hoặc password sai**
   - Kiểm tra lại email và password đã nhập đúng chưa

3. **User chưa tồn tại**
   - Email chưa được đăng ký trong hệ thống

## ✅ Đã sửa

1. **Cải thiện error handling** trong `authService.ts`:
   - Phát hiện và hiển thị lỗi rõ ràng hơn
   - Thông báo cụ thể cho từng loại lỗi

2. **Better error messages**:
   - "Invalid email or password" - khi credentials sai
   - "Please verify your email" - khi email chưa verify
   - "Too many requests" - khi bị rate limit

## 🛠️ Giải pháp

### Cách 1: Verify Email (Khuyến nghị)

1. **Kiểm tra email inbox**:
   - Tìm email từ Supabase
   - Subject: "Confirm your signup"
   - Click vào link xác nhận

2. **Nếu không thấy email**:
   - Kiểm tra spam/junk folder
   - Đợi 1-2 phút (email có thể delay)
   - Thử resend confirmation email

### Cách 2: Disable Email Confirmation (Development)

Nếu đang trong development và muốn bỏ qua email verification:

1. **Vào Supabase Dashboard**:
   - Authentication → Settings
   - Tắt "Enable email confirmations"

2. **Hoặc sử dụng Magic Link**:
   - Supabase có thể gửi magic link thay vì password

### Cách 3: Kiểm tra lại thông tin

1. **Email đúng chưa?**
   - Kiểm tra email đã nhập đúng format
   - Email đã được đăng ký chưa?

2. **Password đúng chưa?**
   - Password phải khớp với khi đăng ký
   - Kiểm tra có space hoặc ký tự đặc biệt không

## 📝 Hướng dẫn verify email

### Bước 1: Kiểm tra email
- Mở inbox của email đã dùng để đăng ký
- Tìm email từ Supabase (có thể trong spam)

### Bước 2: Click link verify
- Click vào link "Confirm your signup" trong email
- Browser sẽ mở và xác nhận

### Bước 3: Đăng nhập lại
- Quay lại app
- Đăng nhập với email và password đã đăng ký

## 🔍 Debug

Nếu vẫn không được, kiểm tra:

1. **Console log**:
   - Mở DevTools (F12)
   - Xem Console tab để xem error message chi tiết

2. **Network tab**:
   - Xem request/response trong Network tab
   - Kiểm tra error message từ server

3. **Supabase Dashboard**:
   - Authentication → Users
   - Xem user đã được tạo chưa
   - Xem email đã được confirm chưa (cột "Email Confirmed")

## 💡 Tips

- **Development**: Tắt email confirmation để test nhanh hơn
- **Production**: Giữ email confirmation để bảo mật
- **Test account**: Dùng email thật để nhận verification email

## 🚀 Code đã được cập nhật

Error handling đã được cải thiện để:
- Hiển thị message rõ ràng hơn
- Phân biệt các loại lỗi khác nhau
- User experience tốt hơn

