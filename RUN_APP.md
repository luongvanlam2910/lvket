# 🚀 Hướng dẫn chạy app

## Chạy app

```bash
npm start
```

Sau đó chọn platform:
- Nhấn `w` - Chạy trên Web
- Nhấn `i` - Chạy trên iOS (cần Xcode)
- Nhấn `a` - Chạy trên Android (cần Android Studio)
- Nhấn `r` - Reload app
- Nhấn `m` - Toggle menu

## Chạy trực tiếp trên Web

```bash
npm run web
```

App sẽ tự động mở tại: `http://localhost:8081` (hoặc port khác)

## Chạy trên iOS

```bash
npm run ios
```

## Chạy trên Android

```bash
npm run android
```

## Lưu ý

1. **Lần đầu chạy** có thể mất 1-2 phút để build
2. **Web**: App sẽ mở tự động trong browser
3. **Native**: Cần có simulator/emulator đang chạy

## Troubleshooting

### Port đã được sử dụng
```bash
# Kill process trên port 8081
npx kill-port 8081
npm start
```

### Cache issues
```bash
# Clear cache và chạy lại
npm start -- --clear
```

### Dependencies issues
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

