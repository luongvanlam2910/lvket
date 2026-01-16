# 🔴 Sửa lỗi Upload Photo - UI Issues

## ❓ Vấn đề

1. **Màn hình Camera không đóng** sau khi upload thành công
2. **Trang chủ không hiển thị ảnh** đã upload

## 🔍 Nguyên nhân

### 1. CameraScreen không đóng
- Code đợi user nhấn "OK" trên Alert mới đóng màn hình
- Alert có thể không hoạt động tốt trên web
- User phải thao tác thêm một bước

### 2. HomeScreen không hiển thị ảnh
- `photoService.getPhotos()` chỉ lấy photos từ **bạn bè**, không lấy photos của **chính user**
- Nếu user chưa có bạn bè, `friendIds` sẽ là mảng rỗng → không có photos nào
- Khi user upload ảnh, ảnh đó thuộc về chính user, nên không hiển thị

## ✅ Đã sửa

### 1. CameraScreen (`src/screens/Camera/CameraScreen.tsx`)
- **Đóng màn hình ngay** sau khi upload thành công
- Hiển thị Alert success message (non-blocking) sau khi đóng
- User không cần nhấn "OK" nữa

```typescript
// Trước:
Alert.alert('Success', 'Photo uploaded!', [
  { text: 'OK', onPress: () => navigation.goBack() }
]);

// Sau:
navigation.goBack(); // Đóng ngay
setTimeout(() => {
  Alert.alert('Success', 'Photo uploaded!');
}, 100);
```

### 2. photoService.getPhotos (`src/services/storage/photoService.ts`)
- **Bao gồm cả photos của chính user** trong kết quả
- Thêm `userId` vào danh sách `allUserIds` để query

```typescript
// Trước:
const friendIds = friendships?.map(f => f.friend_id) || [];
const { data: photos } = await supabase
  .from('photos')
  .select('*')
  .in('user_id', friendIds) // Chỉ lấy từ friends

// Sau:
const friendIds = friendships?.map(f => f.friend_id) || [];
const allUserIds = [userId, ...friendIds]; // Bao gồm cả chính user
const { data: photos } = await supabase
  .from('photos')
  .select('*')
  .in('user_id', allUserIds) // Lấy từ user + friends
```

### 3. HomeScreen (`src/screens/Home/HomeScreen.tsx`)
- **Tự động refresh** khi quay lại từ Camera screen
- Sử dụng `useFocusEffect` từ React Navigation

```typescript
// Thêm:
useFocusEffect(
  React.useCallback(() => {
    loadPhotos();
  }, [])
);
```

## 🎯 Kết quả

Sau khi sửa:
- ✅ Màn hình Camera đóng ngay sau khi upload thành công
- ✅ Trang chủ hiển thị cả ảnh của chính user và ảnh từ bạn bè
- ✅ Trang chủ tự động refresh khi quay lại từ Camera
- ✅ User thấy ảnh mới upload ngay lập tức

## 📝 Lưu ý

- Nếu vẫn không thấy ảnh, kiểm tra:
  1. RLS policies cho table `photos` đã đúng chưa
  2. User profile đã được tạo trong `public.users` chưa
  3. Storage buckets và policies đã setup chưa

