import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth/authService';
import { supabase } from '../../services/api/supabase';
import { User } from '../../types';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUsername(currentUser.username || '');
        setAvatarUri(currentUser.avatar_url || null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Lỗi', 'Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!username.trim()) {
      Alert.alert('Lỗi', 'Tên người dùng không được để trống');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = user.avatar_url;

      // Upload avatar if changed
      if (avatarUri && avatarUri !== user.avatar_url && !avatarUri.startsWith('http')) {
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}_avatar.jpg`;
        
        const response = await fetch(avatarUri);
        const blob = await response.blob();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        
        avatarUrl = urlData.publicUrl;
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Close screen immediately after successful save
      navigation.goBack();
      
      // Show success message (non-blocking)
      setTimeout(() => {
        Alert.alert('Thành công', 'Đã cập nhật hồ sơ');
      }, 100);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButton}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {username[0]?.toUpperCase() || user?.email[0].toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.editAvatarBadge}>
            <Text style={styles.editAvatarText}>📷</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên người dùng</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nhập tên người dùng"
              autoCapitalize="none"
              maxLength={30}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
              placeholder="Email"
            />
            <Text style={styles.hint}>Email không thể thay đổi</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#666',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editAvatarText: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

