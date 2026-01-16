# 🔴 Sửa lỗi Settings Screen

## ❓ Vấn đề

1. **Edit Profile**: Khi lưu không đóng màn hình
2. **Settings Screen**: Không hiển thị avatar sau khi update
3. **Widget Settings**: Chưa dùng được

## ✅ Đã sửa

### 1. EditProfileScreen - Đóng màn hình sau khi save

**Trước:**
```typescript
Alert.alert('Success', 'Profile updated successfully', [
  {
    text: 'OK',
    onPress: () => navigation.goBack(),
  },
]);
```

**Sau:**
```typescript
// Đóng màn hình ngay sau khi save thành công
navigation.goBack();

// Hiển thị success message (non-blocking)
setTimeout(() => {
  Alert.alert('Success', 'Profile updated successfully');
}, 100);
```

### 2. SettingsScreen - Hiển thị avatar

**Trước:**
```typescript
<View style={styles.avatarPlaceholder}>
  <Text style={styles.avatarText}>
    {user?.username?.[0]?.toUpperCase() || 'U'}
  </Text>
</View>
```

**Sau:**
```typescript
{user?.avatar_url ? (
  <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
) : (
  <View style={styles.avatarPlaceholder}>
    <Text style={styles.avatarText}>
      {user?.username?.[0]?.toUpperCase() || 'U'}
    </Text>
  </View>
)}
```

**Thêm style:**
```typescript
avatar: {
  width: 60,
  height: 60,
  borderRadius: 30,
  marginRight: 15,
},
```

### 3. Widget Settings - Cải thiện error handling

**Trước:**
```typescript
catch (error) {
  console.error('Error updating widget settings:', error);
  Alert.alert('Error', 'Failed to update widget settings');
  setWidgetEnabled(!value); // Revert on error
}
```

**Sau:**
```typescript
catch (error: any) {
  console.error('Error updating widget settings:', error);
  
  // Revert on error
  setWidgetEnabled(previousValue);
  
  // Show specific error message
  let errorMessage = 'Failed to update widget settings';
  if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
    errorMessage = 'Widget settings table not found. Please run supabase-schema.sql in Supabase SQL Editor.';
  } else if (error.message?.includes('row-level security')) {
    errorMessage = 'Permission denied. Please check RLS policies in Supabase.';
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  Alert.alert('Error', errorMessage);
}
```

### 4. Auto-refresh SettingsScreen

- Đã có `useFocusEffect` để tự động refresh khi quay lại từ EditProfile
- User data và avatar sẽ được cập nhật tự động

## 🎯 Kết quả

Sau khi sửa:
- ✅ Edit Profile đóng màn hình ngay sau khi save thành công
- ✅ Settings Screen hiển thị avatar nếu có
- ✅ Widget settings có error handling tốt hơn
- ✅ Settings Screen tự động refresh khi quay lại

## 📝 Lưu ý

### Widget Settings

Nếu widget settings vẫn không hoạt động, kiểm tra:

1. **Table đã được tạo chưa**:
   - Vào Supabase Dashboard → Table Editor
   - Kiểm tra table `widget_settings` đã tồn tại chưa
   - Nếu chưa, chạy `supabase-schema.sql`

2. **RLS Policies**:
   - Vào Supabase Dashboard → Authentication → Policies
   - Kiểm tra table `widget_settings` có policies:
     - "Users can view their own widget settings"
     - "Users can update their own widget settings"
     - "Users can create their own widget settings"

3. **User profile**:
   - Đảm bảo user đã có profile trong `public.users` table

## 🔧 Troubleshooting

### Widget settings không lưu

1. **Kiểm tra console logs** để xem lỗi cụ thể
2. **Kiểm tra RLS policies** trong Supabase
3. **Kiểm tra table** `widget_settings` đã được tạo chưa
4. **Thử logout và login lại** để refresh session

### Avatar không hiển thị

1. **Kiểm tra** `user.avatar_url` có giá trị không
2. **Kiểm tra** URL có hợp lệ không
3. **Refresh Settings screen** bằng cách navigate đi và quay lại
4. **Kiểm tra** storage bucket "photos" có public không

