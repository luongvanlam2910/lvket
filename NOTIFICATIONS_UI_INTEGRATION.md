# 🔔 Tích hợp UI Notifications

## ✅ Đã triển khai

UI hoàn chỉnh để hiển thị notifications trong app.

## 📱 Tính năng UI

### 1. NotificationsScreen
- ✅ Hiển thị danh sách notifications
- ✅ Phân biệt notifications đã đọc/chưa đọc
- ✅ Hiển thị avatar, username, message, thời gian
- ✅ Pull to refresh
- ✅ Mark as read khi click vào notification
- ✅ Mark all as read
- ✅ Navigate đến Home/Stories khi click notification

### 2. Tab Navigation với Badge
- ✅ Thêm tab "Notifications" vào bottom navigation
- ✅ Badge hiển thị số notifications chưa đọc
- ✅ Tự động refresh unread count
- ✅ Refresh khi app vào foreground

### 3. Realtime Integration
- ✅ Setup Realtime listener trong App.tsx
- ✅ Tự động nhận notifications mới
- ✅ Gửi local notification khi có notification mới

## 🎨 UI Components

### NotificationsScreen
- **Header**: Title "Notifications" + "Mark all read" button
- **List**: Danh sách notifications với:
  - Avatar (hoặc placeholder)
  - Message
  - Time ago
  - Unread dot indicator
- **Empty State**: "No notifications yet"

### Tab Badge
- Red badge với số unread count
- Hiển thị "99+" nếu > 99
- Tự động ẩn khi không có unread notifications

## 🔄 Flow hoạt động

1. **User A upload photo/story**:
   - Notification được tạo cho tất cả bạn bè
   - Insert vào database

2. **User B nhận notification**:
   - Supabase Realtime trigger event
   - App.tsx listener nhận được
   - Gửi local notification
   - Unread count tự động update

3. **User B mở Notifications tab**:
   - Hiển thị danh sách notifications
   - Click vào notification → mark as read
   - Navigate đến Home/Stories nếu là photo/story

## 📝 Files đã tạo/sửa

### Mới tạo:
- `src/screens/Notifications/NotificationsScreen.tsx` - Screen hiển thị notifications

### Đã sửa:
- `src/navigation/MainNavigator.tsx` - Thêm tab Notifications với badge
- `App.tsx` - Setup Realtime listener

## 🚀 Sử dụng

### Xem Notifications
1. Click vào tab "Notifications" ở bottom navigation
2. Xem danh sách notifications
3. Click vào notification để mark as read và navigate

### Mark all as read
- Click "Mark all read" ở header

### Refresh
- Pull down để refresh danh sách

## 🎯 Kết quả

- ✅ UI hoàn chỉnh để hiển thị notifications
- ✅ Badge hiển thị số unread notifications
- ✅ Realtime notifications (tự động update)
- ✅ Local notifications trên device
- ✅ Mark as read functionality
- ✅ Navigation đến relevant screens

## 📝 Lưu ý

- Notifications chỉ hiển thị cho authenticated users
- Unread count tự động refresh mỗi 30 giây
- Realtime listener chỉ hoạt động khi app đang chạy
- Local notifications cần permission từ user

## 🔧 Troubleshooting

### Notifications không hiển thị
1. Kiểm tra table `notifications` đã được tạo chưa
2. Kiểm tra RLS policies
3. Kiểm tra user có friends không
4. Xem console logs

### Badge không update
1. Kiểm tra `loadUnreadCount()` có được gọi không
2. Kiểm tra Realtime listener có hoạt động không
3. Refresh app

### Local notifications không hiển thị
1. Kiểm tra notification permissions
2. Kiểm tra `notificationService.requestPermissions()` đã được gọi chưa
3. Kiểm tra device settings

