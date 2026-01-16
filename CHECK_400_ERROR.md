# 🔍 Kiểm tra lỗi 400 Bad Request

## 📋 Cách xem error message chi tiết

### Bước 1: Mở DevTools
1. Nhấn `F12` trong browser
2. Chọn tab **Network**

### Bước 2: Xem Request Details
1. Tìm request **"signup"** (có status 400)
2. Click vào request đó
3. Chọn tab **"Payload"** để xem data gửi lên:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

### Bước 3: Xem Response (QUAN TRỌNG)
1. Chọn tab **"Response"** 
2. Xem error message từ Supabase, ví dụ:
   ```json
   {
     "message": "User already registered",
     "code": "user_already_registered"
   }
   ```

### Bước 4: Xem Console
1. Chọn tab **"Console"**
2. Tìm log có "Sign up 400 error"
3. Xem error object chi tiết

## 🔍 Các lỗi 400 thường gặp

### 1. "User already registered"
**Response body:**
```json
{
  "message": "User already registered",
  "code": "user_already_registered"
}
```
**Giải pháp**: Dùng email khác hoặc đăng nhập

### 2. "Password does not meet requirements"
**Response body:**
```json
{
  "message": "Password should be at least 6 characters"
}
```
**Giải pháp**: Dùng password >= 6 ký tự

### 3. "Invalid email"
**Response body:**
```json
{
  "message": "Invalid email address"
}
```
**Giải pháp**: Kiểm tra format email

### 4. "signup_disabled"
**Response body:**
```json
{
  "message": "Sign up is disabled"
}
```
**Giải pháp**: Vào Supabase Dashboard → Authentication → Settings → Bật "Enable email sign up"

### 5. "Invalid API key"
**Response body:**
```json
{
  "message": "Invalid API key"
}
```
**Giải pháp**: Kiểm tra API key trong `supabase.ts`

## 🛠️ Kiểm tra Supabase Settings

1. **Vào Supabase Dashboard**:
   - https://supabase.com/dashboard
   - Chọn project: `gjluacrkryivkjezsokt`

2. **Authentication → Settings**:
   - ✅ "Enable email sign up" phải BẬT
   - ✅ "Enable email confirmations" - có thể TẮT trong development

3. **Authentication → Users**:
   - Kiểm tra email đã tồn tại chưa
   - Xem có user nào bị block không

## 📝 Checklist

- [ ] Đã xem Response tab để biết error message cụ thể
- [ ] Đã kiểm tra Payload tab để xem data gửi lên
- [ ] Đã kiểm tra Supabase Settings
- [ ] Đã kiểm tra email chưa tồn tại
- [ ] Đã kiểm tra password >= 6 ký tự

## 💡 Next Steps

1. **Xem Response tab** trong Network để biết error message chính xác
2. **Copy error message** và gửi cho tôi để tôi có thể sửa cụ thể
3. **Kiểm tra Supabase Settings** như hướng dẫn trên

