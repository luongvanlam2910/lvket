# 🔔 Hệ thống Thông báo (Notifications)

## ✅ Đã triển khai

Hệ thống thông báo tự động khi bạn bè đăng photos/stories.

## 📋 Tính năng

1. **Tự động tạo notifications** khi:
   - Bạn bè upload photo
   - Bạn bè post story
   - (Có thể mở rộng: friend request, reactions, etc.)

2. **Realtime notifications**:
   - Sử dụng Supabase Realtime để listen notifications mới
   - Tự động hiển thị local notification khi có notification mới

3. **Notification management**:
   - Xem danh sách notifications
   - Đánh dấu đã đọc
   - Đếm số notifications chưa đọc

## 🗄️ Database Schema

### Notifications Table

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  from_user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('photo', 'story', 'friend_request', 'friend_accepted', 'reaction')),
  photo_id UUID REFERENCES photos(id),
  friendship_id UUID REFERENCES friendships(id),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

## 🚀 Setup

### 1. Chạy SQL Script

1. **Vào Supabase Dashboard** → SQL Editor
2. **Copy và chạy** file `create-notifications-table.sql`
3. **Kiểm tra**:
   - Table `notifications` đã được tạo
   - RLS policies đã được thiết lập
   - Realtime đã được enable

### 2. Code đã được tích hợp

- ✅ `photoService.uploadPhoto()` - Tự động tạo notifications khi upload
- ✅ `notificationService` - Các functions để quản lý notifications
- ✅ Realtime listener - Listen notifications mới

## 📱 Sử dụng

### Trong App Component

```typescript
import { notificationService } from './services/notifications/notificationService';
import { useEffect } from 'react';

useEffect(() => {
  const user = await authService.getCurrentUser();
  if (!user) return;

  // Setup Realtime listener
  const subscription = notificationService.setupRealtimeListener(
    user.id,
    (notification) => {
      // Handle new notification
      console.log('New notification:', notification);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Lấy danh sách notifications

```typescript
const notifications = await notificationService.getNotifications(userId);
```

### Đánh dấu đã đọc

```typescript
await notificationService.markAsRead(notificationId, userId);
await notificationService.markAllAsRead(userId);
```

### Đếm số notifications chưa đọc

```typescript
const unreadCount = await notificationService.getUnreadCount(userId);
```

## 🔄 Flow hoạt động

1. **User A upload photo/story**:
   - `photoService.uploadPhoto()` được gọi
   - Sau khi upload thành công, gọi `createNotificationsForFriends()`
   - Lấy danh sách bạn bè của User A
   - Tạo notification cho mỗi bạn bè

2. **User B (bạn bè của A) nhận notification**:
   - Notification được insert vào database
   - Supabase Realtime trigger event
   - App của User B nhận được event
   - Hiển thị local notification
   - Update UI nếu đang mở app

## 🎯 Kết quả

- ✅ Tự động tạo notifications khi bạn bè upload photos/stories
- ✅ Realtime notifications (không cần refresh)
- ✅ Local notifications trên device
- ✅ Quản lý notifications (đọc, đếm, etc.)

## 📝 Lưu ý

- Notifications chỉ được tạo cho **accepted friends**
- Notification message tự động generate từ username/email
- Có thể mở rộng thêm types: `friend_request`, `friend_accepted`, `reaction`
- Realtime cần được enable trong Supabase Dashboard

## 🔧 Troubleshooting

### Notifications không được tạo

1. Kiểm tra table `notifications` đã được tạo chưa
2. Kiểm tra RLS policies đã đúng chưa
3. Kiểm tra user có friends không
4. Xem console logs để debug

### Realtime không hoạt động

1. Kiểm tra Realtime đã được enable cho table `notifications` chưa
2. Kiểm tra Supabase connection
3. Kiểm tra user đã đăng nhập chưa

