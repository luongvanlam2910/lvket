import * as Notifications from 'expo-notifications';
import { supabase } from '../api/supabase';
import { authService } from '../auth/authService';

export interface AppNotification {
  id: string;
  user_id: string;
  from_user_id: string | null;
  type: 'photo' | 'story' | 'friend_request' | 'friend_accepted' | 'reaction';
  photo_id: string | null;
  friendship_id: string | null;
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

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // Request permissions
  requestPermissions: async () => {
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
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to user profile in Supabase
    const user = await authService.getCurrentUser();
    if (user && token) {
      // You might want to create a user_tokens table or add push_token to users table
      // For now, we'll just log it
      console.log('Push token:', token);
    }

    return true;
  },

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

  // Send local notification when new notification arrives
  sendLocalNotificationForAppNotification: async (notification: AppNotification) => {
    const title = notification.type === 'story' 
      ? 'New Story' 
      : notification.type === 'photo'
      ? 'New Photo'
      : 'New Notification';
    
    const body = notification.message || 'You have a new notification';

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          notificationId: notification.id,
          type: notification.type,
          photoId: notification.photo_id,
        },
        sound: true,
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

