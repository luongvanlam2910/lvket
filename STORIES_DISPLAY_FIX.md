# 🔴 Sửa lỗi Stories không hiển thị

## ❓ Vấn đề

User đã post stories thành công nhưng không hiển thị trên StoriesScreen.

## 🔍 Nguyên nhân

Giống như vấn đề với photos, `photoService.getStories()` chỉ lấy stories từ **bạn bè**, không lấy stories của **chính user**.

- Khi user post story, story đó thuộc về `user_id` của chính user
- `getStories()` chỉ query stories từ `friendIds` (bạn bè)
- Nếu user chưa có bạn bè, hoặc story thuộc về chính user → không hiển thị

## ✅ Đã sửa

### 1. photoService.getStories (`src/services/storage/photoService.ts`)
- **Bao gồm cả stories của chính user** trong kết quả
- Thêm `userId` vào danh sách `allUserIds` để query

```typescript
// Trước:
const friendIds = friendships?.map(f => f.friend_id) || [];
const { data: stories } = await supabase
  .from('photos')
  .select('*')
  .in('user_id', friendIds) // Chỉ lấy từ friends
  .eq('is_story', true)

// Sau:
const friendIds = friendships?.map(f => f.friend_id) || [];
const allUserIds = [userId, ...friendIds]; // Bao gồm cả chính user
const { data: stories } = await supabase
  .from('photos')
  .select('*')
  .in('user_id', allUserIds) // Lấy từ user + friends
  .eq('is_story', true)
```

### 2. StoriesScreen (`src/screens/Stories/StoriesScreen.tsx`)
- **Tự động refresh** khi quay lại từ Camera screen
- Sử dụng `useFocusEffect` từ React Navigation

```typescript
// Thêm:
useFocusEffect(
  React.useCallback(() => {
    loadStories();
  }, [])
);
```

## 🎯 Kết quả

Sau khi sửa:
- ✅ StoriesScreen hiển thị cả stories của chính user và stories từ bạn bè
- ✅ StoriesScreen tự động refresh khi quay lại từ Camera
- ✅ Story mới post sẽ hiển thị ngay lập tức

## 📝 Lưu ý

- Stories có thời gian hết hạn 24 giờ (từ khi post)
- Chỉ hiển thị stories chưa hết hạn (`expires_at > now`)
- Nếu vẫn không thấy story, kiểm tra:
  1. Story đã được lưu với `is_story = true` chưa
  2. `expires_at` đã được set đúng chưa (24h từ khi post)
  3. RLS policies cho table `photos` đã đúng chưa

