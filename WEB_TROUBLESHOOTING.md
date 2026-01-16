# Khắc phục sự cố Web

## ✅ Đã cài đặt

- `react-dom` - React DOM cho web
- `react-native-web` - React Native components cho web

## 🚀 Chạy Web

```bash
npm run web
```

Hoặc từ Expo CLI:
```bash
npm start
# Sau đó nhấn 'w' để chọn web
```

## ⏱️ Thời gian build

Lần đầu tiên chạy web có thể mất 1-2 phút để:
- Build webpack
- Compile TypeScript
- Bundle assets

## 🌐 URL mặc định

Sau khi build xong, app sẽ mở tại:
- `http://localhost:8081` (hoặc port khác nếu 8081 bị chiếm)

## 🔍 Kiểm tra

1. **Xem terminal output** - Sẽ hiển thị URL khi build xong
2. **Kiểm tra browser console** - Mở DevTools (F12) để xem lỗi
3. **Kiểm tra network tab** - Xem có request nào fail không

## ❌ Lỗi thường gặp

### 1. "Cannot find module 'react-dom'"
→ Đã cài đặt, nếu vẫn lỗi: `npm install react-dom react-native-web --save`

### 2. "Module not found: Can't resolve 'expo-camera'"
→ Một số Expo modules không hỗ trợ web. Cần thêm polyfill hoặc disable trên web.

### 3. "Cannot read property 'navigate' of undefined"
→ Navigation issue. Đã sửa trong code.

### 4. Web không mở tự động
→ Copy URL từ terminal và paste vào browser

## 📝 Lưu ý

- **Camera**: Không hoạt động trên web (cần device)
- **File System**: Một số APIs không hỗ trợ web
- **Secure Store**: Sử dụng localStorage trên web

## 🛠️ Nếu vẫn không chạy

1. Xóa cache:
```bash
rm -rf .expo
rm -rf node_modules/.cache
npm start -- --clear
```

2. Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

3. Kiểm tra port:
- Đảm bảo port 8081 (hoặc port được chỉ định) không bị chiếm

