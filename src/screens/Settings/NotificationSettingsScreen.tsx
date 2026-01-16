import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../../services/notifications/notificationService';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [photoNotifications, setPhotoNotifications] = useState(true);
  const [storyNotifications, setStoryNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      setPushEnabled(hasPermission);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const handleTogglePush = async (value: boolean) => {
    if (value) {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng bật thông báo trong cài đặt thiết bị của bạn'
        );
        return;
      }
    }
    setPushEnabled(value);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo đẩy</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Bật thông báo đẩy</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo trên thiết bị của bạn
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#ddd', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loại thông báo</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Ảnh mới</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi bạn bè chia sẻ ảnh
              </Text>
            </View>
            <Switch
              value={photoNotifications}
              onValueChange={setPhotoNotifications}
              trackColor={{ false: '#ddd', true: '#000' }}
              thumbColor="#fff"
              disabled={!pushEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Story mới</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi bạn bè đăng story
              </Text>
            </View>
            <Switch
              value={storyNotifications}
              onValueChange={setStoryNotifications}
              trackColor={{ false: '#ddd', true: '#000' }}
              thumbColor="#fff"
              disabled={!pushEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Lời mời kết bạn</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi có lời mời kết bạn
              </Text>
            </View>
            <Switch
              value={friendRequestNotifications}
              onValueChange={setFriendRequestNotifications}
              trackColor={{ false: '#ddd', true: '#000' }}
              thumbColor="#fff"
              disabled={!pushEnabled}
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});

