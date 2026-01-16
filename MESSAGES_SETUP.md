# Hướng dẫn Setup Messages Feature

## ✅ Đã hoàn thành

Tính năng nhắn tin đã được tích hợp vào app với các chức năng:

1. **Messages Table** - Database schema cho messages
2. **Message Service** - Service để gửi/nhận messages và realtime
3. **Messages Screen** - Danh sách conversations với bạn bè
4. **Chat Screen** - Màn hình chat với một friend cụ thể
5. **Realtime Messaging** - Nhận messages real-time qua Supabase Realtime
6. **Notifications** - Tự động tạo notification khi có message mới

## 📋 Setup Database

### Cách 1: Chạy toàn bộ schema mới (nếu chưa setup)
Chạy file `supabase-schema.sql` trong Supabase SQL Editor (đã bao gồm messages table).

### Cách 2: Chỉ thêm messages table (nếu đã có schema cũ)
Chạy file `create-messages-table.sql` trong Supabase SQL Editor.

## 🎯 Tính năng

### Messages Screen
- Hiển thị danh sách conversations với tất cả bạn bè
- Hiển thị last message và thời gian
- Badge hiển thị số unread messages
- Pull to refresh
- Click vào conversation để mở Chat screen

### Chat Screen
- Gửi/nhận text messages
- Realtime updates (nhận messages ngay lập tức)
- Auto mark as read khi mở chat
- Hiển thị avatar và tên friend
- Scroll to bottom khi có message mới
- Keyboard handling cho mobile

### Message Service
- `sendMessage()` - Gửi message
- `getMessages()` - Lấy messages giữa 2 users
- `getConversations()` - Lấy danh sách conversations
- `markAsRead()` - Đánh dấu messages đã đọc
- `getUnreadCount()` - Đếm unread messages
- `setupRealtimeListener()` - Setup realtime listener

## 🔔 Notifications

Khi có message mới, hệ thống sẽ:
1. Tạo notification trong `notifications` table
2. Gửi local notification (nếu có)
3. Cập nhật unread count badge

## 📱 Navigation

- **Messages Tab** - Tab mới trong bottom navigation (icon 💬)
- **Chat Screen** - Mở từ Messages screen khi click vào conversation

## 🎨 UI Features

- Modern chat bubble design
- Different styles cho sent/received messages
- Avatar display với fallback
- Time stamps
- Unread badges
- Empty states

## ⚠️ Lưu ý

1. **Realtime**: Cần enable Realtime cho `messages` table trong Supabase
2. **RLS Policies**: Đã được setup để users chỉ xem messages của mình
3. **Friends Only**: Chỉ có thể chat với bạn bè đã accepted
4. **Notifications**: Cần setup notifications table trước (đã có trong schema)

## 🚀 Sử dụng

1. Chạy SQL script trong Supabase
2. Restart app
3. Vào tab "Messages" để xem conversations
4. Click vào conversation để bắt đầu chat
5. Gửi messages và nhận realtime updates!

