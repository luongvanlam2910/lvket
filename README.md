# 📸 Locket App - Photo Sharing App

Ứng dụng chia sẻ ảnh tức thời với bạn bè, tương tự như Locket.

## ✨ Tính năng

- ✅ **Authentication**: Đăng ký, đăng nhập với Supabase
- ✅ **Photo Sharing**: Chia sẻ ảnh với bạn bè
- ✅ **Stories**: Stories tự động hết hạn sau 24h
- ✅ **Friends Management**: Tìm kiếm, thêm, chấp nhận bạn bè
- ✅ **Reactions**: React với emoji trên photos
- ✅ **Camera**: Chụp ảnh, chọn từ thư viện, thêm caption
- ✅ **Real-time Updates**: Cập nhật photos/stories real-time

## 🚀 Bắt đầu nhanh

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Thiết lập Supabase

**QUAN TRỌNG**: Phải thiết lập Supabase trước khi chạy app!

Xem file **`QUICK_SETUP.md`** để biết hướng dẫn nhanh (5 phút).

Hoặc xem **`setup-supabase.md`** để biết hướng dẫn chi tiết.

#### Tóm tắt:

1. **Tạo Storage Buckets** (qua Dashboard hoặc script):
   - `photos` (public)
   - `thumbnails` (public)

2. **Chạy SQL Scripts** (trong Supabase SQL Editor):
   - `storage-policies.sql` - Tạo storage policies
   - `supabase-schema.sql` - Tạo database schema

### 3. Chạy app

```bash
npm start
```

Sau đó chọn platform:
- `i` - iOS
- `a` - Android  
- `w` - Web

## 📁 Cấu trúc Project

```
locket-app/
├── src/
│   ├── components/       # React components
│   │   └── Photo/        # Photo components
│   ├── navigation/       # Navigation config
│   ├── screens/          # App screens
│   │   ├── Auth/         # Login, SignUp
│   │   ├── Camera/       # Camera screen
│   │   ├── Friends/      # Friends management
│   │   ├── Home/          # Home feed
│   │   ├── Settings/      # Settings
│   │   └── Stories/      # Stories
│   ├── services/         # Business logic
│   │   ├── api/          # Supabase client
│   │   ├── auth/         # Auth service
│   │   ├── notifications/# Notification service
│   │   └── storage/      # Photo, Friend services
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── scripts/              # Helper scripts
├── supabase-schema.sql   # Database schema
├── storage-policies.sql  # Storage policies
└── QUICK_SETUP.md        # Quick setup guide
```

## 🔧 Cấu hình

### Supabase Credentials

Đã được cấu hình trong `src/services/api/supabase.ts`:
- URL: `https://gjluacrkryivkjezsokt.supabase.co`
- API Key: `sb_publishable_9u84HOw8e3rH-3rTo478nQ_RRzXg19T`

## 📚 Tài liệu

- **`QUICK_SETUP.md`** - Hướng dẫn thiết lập nhanh (5 phút)
- **`setup-supabase.md`** - Hướng dẫn chi tiết thiết lập Supabase
- **`IMPLEMENTATION_SUMMARY.md`** - Tóm tắt các tính năng đã triển khai
- **`SETUP.md`** - Hướng dẫn setup chi tiết

## 🛠️ Scripts

### Tạo Storage Buckets tự động

```bash
# Cách 1: Truyền Service Role Key qua argument
node scripts/create-storage-buckets.js YOUR_SERVICE_ROLE_KEY

# Cách 2: Dùng .env file
# Tạo file .env với: SUPABASE_SERVICE_ROLE_KEY=your_key
node scripts/create-storage-buckets.js
```

**Lưu ý**: Lấy Service Role Key từ Supabase Dashboard → Project Settings → API

## ⚠️ Lưu ý quan trọng

1. **Storage Buckets**: Phải tạo trước khi upload ảnh
2. **Database Schema**: Phải chạy trước khi đăng ký user đầu tiên
3. **Storage Policies**: Phải chạy sau khi tạo buckets
4. **Permissions**: App cần camera và media library permissions

## 🐛 Troubleshooting

### Lỗi "Bucket not found"
→ Kiểm tra đã tạo storage buckets chưa (xem `QUICK_SETUP.md`)

### Lỗi "Table does not exist"
→ Kiểm tra đã chạy `supabase-schema.sql` chưa

### Lỗi "Permission denied"
→ Kiểm tra đã chạy `storage-policies.sql` chưa

### Lỗi "RLS policy violation"
→ Kiểm tra RLS policies trong database schema

## 📝 TODO

- [ ] Photo Dump feature
- [ ] Widget components UI
- [ ] Real-time updates với Supabase Realtime
- [ ] Video recording
- [ ] Voice messages

## 📄 License

Private project

## 👤 Author

Developed for Locket-like photo sharing app
