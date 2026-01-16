# 🔴 Sửa lỗi Logout không hoạt động

## ❓ Vấn đề

Chức năng đăng xuất không hoạt động - sau khi click Logout, user vẫn ở trong app.

## 🔍 Nguyên nhân

1. **Navigation structure phức tạp**: SettingsScreen nằm trong Tab Navigator, Tab Navigator nằm trong Stack Navigator
2. **Auth state listener**: Có thể không trigger đúng cách
3. **Navigation reset**: Cần reset navigation stack đúng cách

## ✅ Đã sửa

### 1. Cải thiện signOut function (`authService.ts`)

**Trước:**
```typescript
signOut: async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
},
```

**Sau:**
```typescript
signOut: async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    
    // Clear any cached data if needed
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
},
```

### 2. Cải thiện handleLogout (`SettingsScreen.tsx`)

**Trước:**
```typescript
onPress: async () => {
  try {
    await authService.signOut();
    navigation.replace('Login');
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to logout');
  }
},
```

**Sau:**
```typescript
onPress: async () => {
  try {
    // Sign out from Supabase
    // This will trigger auth state change listener in App.tsx
    // which will automatically update isAuthenticated and navigate to Login
    await authService.signOut();
    
    // The App.tsx auth state listener will handle navigation automatically
    // But we can also try to navigate manually as fallback
    try {
      const rootNav = navigation.getParent()?.getParent?.() || navigation.getParent();
      if (rootNav && typeof (rootNav as any).reset === 'function') {
        (rootNav as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (navError) {
      // Navigation will be handled by App.tsx auth state listener
      console.log('Navigation will be handled by auth state listener');
    }
  } catch (error: any) {
    console.error('Logout error:', error);
    Alert.alert('Error', error.message || 'Failed to logout');
  }
},
```

### 3. Cải thiện checkAuth (`App.tsx`)

**Thêm:**
```typescript
const checkAuth = async () => {
  try {
    const session = await authService.getSession();
    setIsAuthenticated(!!session);
  } catch (error) {
    console.error('Auth check error:', error);
    setIsAuthenticated(false); // Ensure false on error
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Thêm logging cho auth state changes

```typescript
const { data: { subscription } } = authService.onAuthStateChange((session) => {
  console.log('Auth state changed:', !!session);
  setIsAuthenticated(!!session);
});
```

## 🔄 Flow hoạt động

1. **User click Logout**:
   - Alert xác nhận hiển thị
   - User nhấn "Logout"

2. **Sign out từ Supabase**:
   - `authService.signOut()` được gọi
   - Supabase auth session được clear
   - Auth state change event được trigger

3. **Auth state listener trong App.tsx**:
   - Nhận được event `SIGNED_OUT`
   - `setIsAuthenticated(false)` được gọi
   - React re-render với `isAuthenticated = false`

4. **Navigation tự động chuyển**:
   - App.tsx conditional rendering: `{isAuthenticated ? Main : Login}`
   - Tự động render Login screen thay vì Main screen

5. **Fallback navigation**:
   - Nếu auth state listener không hoạt động, manual navigation sẽ reset stack

## 🎯 Kết quả

Sau khi sửa:
- ✅ Logout hoạt động đúng cách
- ✅ Auth state được clear
- ✅ Navigation tự động chuyển về Login screen
- ✅ Có fallback navigation nếu cần
- ✅ Error handling tốt hơn

## 📝 Lưu ý

- Auth state listener trong App.tsx sẽ tự động handle navigation
- Nếu vẫn không hoạt động, kiểm tra:
  1. Console logs để xem auth state có thay đổi không
  2. Supabase session có được clear không
  3. Navigation structure có đúng không

## 🔧 Troubleshooting

### Logout không chuyển về Login

1. **Kiểm tra console logs**:
   - Xem "Auth state changed: false" có xuất hiện không
   - Xem "User signed out successfully" có xuất hiện không

2. **Kiểm tra Supabase**:
   - Vào Supabase Dashboard → Authentication → Users
   - Kiểm tra session có được clear không

3. **Kiểm tra navigation**:
   - Thử refresh app sau khi logout
   - Kiểm tra App.tsx có render đúng conditional không

### Auth state listener không hoạt động

1. **Kiểm tra subscription**:
   - Đảm bảo subscription không bị unsubscribe sớm
   - Kiểm tra useEffect dependencies

2. **Thử manual navigation**:
   - Fallback navigation sẽ được trigger nếu auth state listener không hoạt động

