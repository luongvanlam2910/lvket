# 🔴 Debug lỗi 400 Bad Request khi đăng ký

## ❓ Cách xem error message chi tiết

### Bước 1: Mở DevTools
1. Nhấn `F12` hoặc `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Chọn tab **Network**

### Bước 2: Xem Response
1. Tìm request **"signup"** trong danh sách
2. Click vào request đó
3. Chọn tab **"Response"** (bên cạnh Headers, Payload)
4. Xem error message từ Supabase

### Bước 3: Xem Payload
1. Chọn tab **"Payload"**
2. Kiểm tra data đang gửi lên:
   - Email format đúng chưa?
   - Password có đủ độ dài không?

## 🔍 Các lỗi 400 thường gặp

### 1. "User already registered"
**Nguyên nhân**: Email đã được đăng ký
**Giải pháp**: 
- Thử đăng nhập thay vì đăng ký
- Hoặc dùng email khác

### 2. "Password does not meet requirements"
**Nguyên nhân**: Password không đủ mạnh
**Giải pháp**:
- Password tối thiểu 6 ký tự
- Nên có chữ hoa, chữ thường, số

### 3. "Invalid email"
**Nguyên nhân**: Email format sai
**Giải pháp**:
- Kiểm tra format: `user@example.com`
- Không có space
- Có @ và domain

### 4. "signup_disabled"
**Nguyên nhân**: Sign up bị tắt trong Supabase
**Giải pháp**:
- Vào Supabase Dashboard → Authentication → Settings
- Bật "Enable email sign up"

## 🛠️ Kiểm tra Supabase Settings

1. **Vào Supabase Dashboard**:
   - https://supabase.com/dashboard
   - Chọn project

2. **Authentication → Settings**:
   - Kiểm tra "Enable email sign up" đã bật chưa
   - Kiểm tra "Enable email confirmations" (có thể tắt trong development)

3. **Authentication → Users**:
   - Xem email đã tồn tại chưa
   - Xem có user nào bị block không

## 📝 Checklist

Trước khi đăng ký:
- [ ] Email format đúng: `user@example.com`
- [ ] Password >= 6 ký tự
- [ ] Email chưa được đăng ký trước đó
- [ ] Supabase sign up đã được bật
- [ ] Không bị rate limit

## 💡 Tips

1. **Xem Response tab** để biết error message chính xác từ Supabase
2. **Copy error message** và tìm trong documentation
3. **Thử với email khác** để test
4. **Kiểm tra Console** để xem log chi tiết

## 🚀 Code đã được cập nhật

Error handling đã được cải thiện để:
- Log error chi tiết hơn
- Hiển thị message rõ ràng hơn
- Phân biệt các loại lỗi 400 khác nhau

