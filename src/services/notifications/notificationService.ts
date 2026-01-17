import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../api/supabase';
import { authService } from '../auth/authService';

export interface AppNotification {
  id: string;
  user_id: string;
  from_user_id: string | null;
  type: 'photo' | 'story' | 'friend_request' | 'friend_accepted' | 'reaction' | 'message';
  photo_id: string | null;
  friendship_id: string | null;
  message_id: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
  from_user?: {
    id: string;
    username: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// Configure notification handler - Optimized for better experience
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Set notification channel for Android (better notification experience)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Mặc định',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });

  Notifications.setNotificationChannelAsync('messages', {
    name: 'Tin nhắn',
    description: 'Thông báo tin nhắn mới',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

// Cache for push token
let cachedPushToken: string | null = null;

export const notificationService = {
  // Request permissions - Improved với token storage
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Get push token
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });
      const token = tokenData.data;
      cachedPushToken = token;

      // Save token to user profile in Supabase
      const user = await authService.getCurrentUser();
      if (user && token) {
        // Store push token in users table
        await supabase
          .from('users')
          .update({ push_token: token })
          .eq('id', user.id)
          .then(() => console.log('Push token saved'))
          .catch((err) => console.error('Failed to save push token:', err));
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Get cached push token
  getPushToken: () => cachedPushToken,

  // Schedule local notification
  scheduleLocalNotification: async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  },

  // Cancel all notifications
  cancelAllNotifications: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Set up notification listeners
  setupListeners: (
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationTapped: (response: Notifications.NotificationResponse) => void
  ) => {
    // Listener for notifications received while app is foregrounded
    const receivedListener = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      onNotificationTapped
    );

    return {
      remove: () => {
        receivedListener.remove();
        responseListener.remove();
      },
    };
  },

  // Get notifications for current user
  getNotifications: async (userId: string, limit: number = 50): Promise<AppNotification[]> => {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        from_user:from_user_id (
          id,
          username,
          email,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return notifications as AppNotification[];
  },

  // Mark notification as read
  markAsRead: async (notificationId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  // Get unread count
  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Send local notification when new notification arrives - Vietnamese
  sendLocalNotificationForAppNotification: async (notification: AppNotification) => {
    const userName = notification.from_user?.username || notification.from_user?.email?.split('@')[0] || 'Ai đó';
    
    let title = 'Thông báo mới';
    let body = notification.message || 'Bạn có thông báo mới';
    let channelId = 'default';

    switch (notification.type) {
      case 'story':
        title = 'Story mới';
        body = `${userName} đã đăng story mới`;
        break;
      case 'photo':
        title = 'Ảnh mới';
        body = `${userName} đã chia sẻ ảnh với bạn`;
        break;
      case 'message':
        title = 'Tin nhắn mới';
        body = notification.message || `${userName} đã gửi tin nhắn`;
        channelId = 'messages';
        break;
      case 'friend_request':
        title = 'Lời mời kết bạn';
        body = `${userName} muốn kết bạn với bạn`;
        break;
      case 'friend_accepted':
        title = 'Đã chấp nhận kết bạn';
        body = `${userName} đã chấp nhận lời mời kết bạn`;
        break;
      case 'reaction':
        title = 'Cảm xúc mới';
        body = `${userName} đã thả cảm xúc vào ảnh của bạn`;
        break;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          notificationId: notification.id,
          type: notification.type,
          photoId: notification.photo_id,
          messageId: notification.message_id,
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: null, // Show immediately
    });
  },

  // Setup Supabase Realtime listener for notifications
  setupRealtimeListener: (
    userId: string,
    onNewNotification: (notification: AppNotification) => void
  ) => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const notification = payload.new as AppNotification;
          
          // Get from_user info
          if (notification.from_user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('id, username, email, avatar_url')
              .eq('id', notification.from_user_id)
              .single();
            
            if (user) {
              notification.from_user = user;
            }
          }

          // Send local notification
          await notificationService.sendLocalNotificationForAppNotification(notification);
          
          // Call callback
          onNewNotification(notification);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};

