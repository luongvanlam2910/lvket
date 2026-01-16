import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '../../services/auth/authService';
import { widgetService } from '../../services/storage/widgetService';
import { User } from '../../types';

export default function SettingsScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetEnabled, setWidgetEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;
      
      setUser(currentUser);
      
      // Load widget settings
      const widgetSettings = await widgetService.getWidgetSettings(currentUser.id);
      setWidgetEnabled(widgetSettings.show_stories || true);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetToggle = async (value: boolean) => {
    if (!user) return;
    
    const previousValue = widgetEnabled;
    setWidgetEnabled(value);
    
    try {
      await widgetService.updateWidgetSettings(user.id, {
        show_stories: value,
      });
    } catch (error: any) {
      console.error('Error updating widget settings:', error);
      
      // Revert on error
      setWidgetEnabled(previousValue);
      
      // Show error message
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
  };

  const handleLogout = async () => {
    console.log('Logout button pressed, starting logout...');
    
    try {
      // Sign out from Supabase
      console.log('Calling authService.signOut()...');
      await authService.signOut();
      console.log('Sign out successful');
      
      // Force navigation to Login screen
      // Try multiple navigation methods to ensure it works
      try {
        const rootNav = navigation.getParent()?.getParent?.() || navigation.getParent();
        console.log('Attempting navigation reset...', { rootNav: !!rootNav });
        
        if (rootNav && typeof (rootNav as any).reset === 'function') {
          (rootNav as any).reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          console.log('Navigation reset successful');
        } else {
          // Fallback: use replace
          console.log('Using navigation.replace as fallback');
          navigation.replace('Login');
        }
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Last resort: reload the app on web
        if (Platform.OS === 'web') {
          window.location.reload();
        }
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      Alert.alert('Error', error.message || 'Failed to logout');
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
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hồ sơ</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.username?.[0]?.toUpperCase() || user?.email[0].toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {user?.username || 'Chưa có tên'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Widget Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Widget</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Bật Widget</Text>
            <Text style={styles.settingDescription}>
              Hiển thị ảnh trên widget màn hình chính
            </Text>
          </View>
          <Switch
            value={widgetEnabled}
            onValueChange={handleWidgetToggle}
            trackColor={{ false: '#ddd', true: '#000' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('EditProfile');
            }
          }}
        >
          <Text style={styles.settingLabel}>Chỉnh sửa hồ sơ</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Privacy');
            }
          }}
        >
          <Text style={styles.settingLabel}>Quyền riêng tư</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('NotificationSettings');
            }
          }}
        >
          <Text style={styles.settingLabel}>Thông báo</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Phiên bản</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('TermsOfService');
            }
          }}
        >
          <Text style={styles.settingLabel}>Điều khoản dịch vụ</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('PrivacyPolicy');
            }
          }}
        >
          <Text style={styles.settingLabel}>Chính sách bảo mật</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            console.log('Logout button onPress triggered');
            handleLogout();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
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
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  settingArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

