import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService, AppNotification } from '../../services/notifications/notificationService';
import { authService } from '../../services/auth/authService';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return;
      }

      setUserId(user.id);
      const notifs = await notificationService.getNotifications(user.id);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    // Mark as read
    if (!notification.read && userId) {
      try {
        await notificationService.markAsRead(notification.id, userId);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on type
    if (notification.type === 'photo' || notification.type === 'story') {
      const parent = navigation.getParent();
      if (parent) {
        if (notification.type === 'story') {
          parent.navigate('Main', { screen: 'Stories' });
        } else {
          parent.navigate('Main', { screen: 'Home' });
        }
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(dateString).toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const userName = item.from_user?.username || item.from_user?.email?.split('@')[0] || 'Someone';
    const avatarUrl = item.from_user?.avatar_url;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userName[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.message}>
            {item.message || `${userName} ${item.type === 'story' ? 'đã đăng story' : 'đã chia sẻ ảnh'}`}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Main', { screen: 'Home' });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllRead}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có thông báo</Text>
          <Text style={styles.emptySubtext}>
            Thông báo từ bạn bè của bạn sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 28,
    color: '#000',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  markAllRead: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

