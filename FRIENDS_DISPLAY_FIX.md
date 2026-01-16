# 🔴 Sửa lỗi không hiển thị bạn bè và photos/stories

## ❓ Vấn đề

1. **Đã add bạn bè nhưng không hiển thị** trong mục bạn bè
2. **Bạn bè không nhìn thấy ảnh hay story** của user đăng

## 🔍 Nguyên nhân

### 1. getFriends chỉ query một phía

Khi user A gửi friend request cho user B, và user B accept:
- Record trong database: `user_id = A`, `friend_id = B`, `status = 'accepted'`
- User A query: `user_id = A` → ✅ Thấy B trong friends list
- User B query: `user_id = B` → ❌ Không thấy A (vì record có `user_id = A`)

**Vấn đề**: `getFriends` chỉ query `user_id = userId`, không query `friend_id = userId`

### 2. getPhotos và getStories cũng chỉ query một phía

Tương tự, khi lấy photos/stories từ bạn bè, chỉ query friendships một phía → thiếu một nửa bạn bè.

## ✅ Đã sửa

### 1. friendService.getFriends (`src/services/storage/friendService.ts`)

**Trước:**
```typescript
// Chỉ query user_id = userId
const { data: friendships } = await supabase
  .from('friendships')
  .select('friend_id, friends:friend_id(*)')
  .eq('user_id', userId)
  .eq('status', 'accepted');
```

**Sau:**
```typescript
// Query cả 2 phía: user_id = userId VÀ friend_id = userId
const { data: friendships1 } = await supabase
  .from('friendships')
  .select('friend_id, friends:friend_id(*)')
  .eq('user_id', userId)
  .eq('status', 'accepted');

const { data: friendships2 } = await supabase
  .from('friendships')
  .select('user_id, users:user_id(*)')
  .eq('friend_id', userId)
  .eq('status', 'accepted');

// Merge và remove duplicates
const friends1 = friendships1?.map(f => f.friends) || [];
const friends2 = friendships2?.map(f => f.users) || [];
const uniqueFriends = [...friends1, ...friends2].filter((friend, index, self) =>
  index === self.findIndex((f) => f.id === friend.id)
);
```

### 2. photoService.getPhotos (`src/services/storage/photoService.ts`)

Sửa tương tự để query friendships cả 2 phía trước khi lấy photos.

### 3. photoService.getStories (`src/services/storage/photoService.ts`)

Sửa tương tự để query friendships cả 2 phía trước khi lấy stories.

### 4. FriendsScreen tự động refresh (`src/screens/Friends/FriendsScreen.tsx`)

Thêm `useFocusEffect` để tự động refresh khi quay lại screen.

## 🎯 Kết quả

Sau khi sửa:
- ✅ Cả 2 user đều thấy nhau trong friends list sau khi accept request
- ✅ Bạn bè có thể thấy photos và stories của nhau
- ✅ FriendsScreen tự động refresh khi quay lại

## 📝 Lưu ý

- Friendship là **bidirectional** (2 chiều) sau khi accept
- Cần query cả `user_id = userId` VÀ `friend_id = userId`
- RLS policies đã đúng, chỉ cần sửa logic query
- Nếu vẫn không thấy, kiểm tra:
  1. Friendship có `status = 'accepted'` chưa
  2. RLS policies đã được apply chưa
  3. User profile đã được tạo trong `public.users` chưa

## 🔄 Flow hoạt động

1. **User A gửi request cho User B**:
   - Record: `user_id = A`, `friend_id = B`, `status = 'pending'`

2. **User B accept request**:
   - Record: `user_id = A`, `friend_id = B`, `status = 'accepted'`

3. **Query friends**:
   - User A: Query `user_id = A` → Thấy B
   - User B: Query `friend_id = B` → Thấy A
   - ✅ Cả 2 đều thấy nhau

4. **Query photos/stories**:
   - Lấy tất cả friend IDs từ cả 2 phía
   - Query photos/stories từ các friend IDs đó
   - ✅ Bạn bè thấy photos/stories của nhau

