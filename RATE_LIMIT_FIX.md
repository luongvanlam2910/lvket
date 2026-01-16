# 🔴 Lỗi 429 Too Many Requests - Giải pháp

## ❓ Nguyên nhân

Lỗi **429 Too Many Requests** xảy ra khi:
- Bạn đã gửi quá nhiều request đến Supabase trong thời gian ngắn
- Supabase có rate limiting để bảo vệ API khỏi abuse
- Đây là cơ chế bảo vệ tự động của Supabase

## ✅ Đã sửa

Đã cải thiện error handling trong `authService.ts` để:
- Phát hiện lỗi 429
- Hiển thị thông báo rõ ràng: "Too many requests. Please wait a few minutes before trying again."

## 🛠️ Giải pháp

### 1. Đợi một vài phút (Khuyến nghị)
- **Đợi 2-5 phút** trước khi thử lại
- Rate limit thường reset sau vài phút

### 2. Kiểm tra Supabase Dashboard
- Vào [Supabase Dashboard](https://supabase.com/dashboard)
- Kiểm tra **Settings → API → Rate Limits**
- Xem giới hạn hiện tại của project

### 3. Nâng cấp Plan (Nếu cần)
- Free tier có giới hạn thấp
- Nâng cấp lên Pro plan để có rate limit cao hơn

### 4. Giảm số lượng requests
- Tránh click nhiều lần nút Sign Up
- Đợi response trước khi thử lại
- Không refresh page nhiều lần

## 📝 Lưu ý

### Rate Limits của Supabase Free Tier:
- **Auth requests**: ~60 requests/phút
- **Database requests**: ~500 requests/phút
- **Storage requests**: ~100 requests/phút

### Best Practices:
1. **Debounce** các button clicks
2. **Disable button** khi đang loading
3. **Show loading state** để user biết đang xử lý
4. **Retry với exponential backoff** (đã implement trong code)

## 🔍 Kiểm tra

Sau khi đợi vài phút, thử lại:
1. Refresh trang web
2. Thử đăng ký lại với email mới
3. Nếu vẫn lỗi, đợi thêm 5-10 phút

## 💡 Tips

- Sử dụng email khác để test (nếu cần test ngay)
- Kiểm tra Network tab trong DevTools để xem số lượng requests
- Tránh spam click khi đang develop

## 🚀 Code đã được cập nhật

Error handling đã được cải thiện để:
- Hiển thị message rõ ràng hơn
- Phân biệt lỗi rate limit với các lỗi khác
- User experience tốt hơn

