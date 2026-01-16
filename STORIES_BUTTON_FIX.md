# 🔴 Sửa lỗi mất nút Upload Stories

## ❓ Vấn đề

Nút "Create Story" chỉ hiển thị khi chưa có stories nào (`stories.length === 0`). Khi đã có stories, nút này biến mất và user không thể tạo story mới.

## 🔍 Nguyên nhân

Trong code cũ:
- Nút "Create Story" chỉ hiển thị trong `emptyContainer` (khi `stories.length === 0`)
- Khi có stories, chỉ hiển thị `FlatList` mà không có nút tạo story mới

## ✅ Đã sửa

### StoriesScreen (`src/screens/Stories/StoriesScreen.tsx`)

**Thêm nút "+" vào header** để luôn hiển thị, giống như HomeScreen có nút camera:

```typescript
// Header với nút tạo story
<View style={styles.header}>
  <View>
    <Text style={styles.headerTitle}>Stories</Text>
    <Text style={styles.headerSubtitle}>
      {stories.length} {stories.length === 1 ? 'story' : 'stories'} available
    </Text>
  </View>
  <TouchableOpacity
    style={styles.addStoryButton}
    onPress={() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Camera', { storyMode: true });
      }
    }}
  >
    <Text style={styles.addStoryButtonText}>+</Text>
  </TouchableOpacity>
</View>
```

**Thêm styles cho nút:**
```typescript
addStoryButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#000',
  justifyContent: 'center',
  alignItems: 'center',
},
addStoryButtonText: {
  color: '#fff',
  fontSize: 28,
  fontWeight: '300',
  lineHeight: 28,
},
```

## 🎯 Kết quả

Sau khi sửa:
- ✅ Nút "+" luôn hiển thị ở header, bất kể có stories hay không
- ✅ User có thể tạo story mới bất cứ lúc nào
- ✅ UI nhất quán với HomeScreen (có nút camera ở header)

## 📝 Lưu ý

- Nút "+" ở góc phải header, giống như nút camera ở HomeScreen
- Click vào nút sẽ mở Camera screen với `storyMode: true`
- Nút "Create Story" trong empty state vẫn giữ nguyên để user dễ nhận biết khi chưa có stories

