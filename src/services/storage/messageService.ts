import { supabase } from '../api/supabase';
import { Message, Conversation, User } from '../../types';

export const messageService = {
  // Send a message
  sendMessage: async (
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'photo' | 'video' | 'voice' = 'text',
    mediaUrl?: string
  ): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        type,
        media_url: mediaUrl,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for receiver
    try {
      await supabase.from('notifications').insert({
        user_id: receiverId,
        from_user_id: senderId,
        type: 'message',
        message_id: data.id,
        message: type === 'text' ? content : `Sent you a ${type}`,
        read: false,
      });
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
      // Don't throw - notification failure shouldn't block message sending
    }

    return data as Message;
  },

  // Get messages between two users
  getMessages: async (
    userId: string,
    friendId: string,
    limit: number = 50
  ): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse() as Message[]; // Reverse to show oldest first
  },

  // Get conversations list (all friends with last message)
  getConversations: async (userId: string): Promise<Conversation[]> => {
    // First, get all accepted friends
    const { data: friendships1, error: error1 } = await supabase
      .from('friendships')
      .select('friend_id, friends:friend_id(*)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error1) throw error1;

    const { data: friendships2, error: error2 } = await supabase
      .from('friendships')
      .select('user_id, users:user_id(*)')
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (error2) throw error2;

    // Combine friends from both directions
    const friends1 = friendships1?.map((f: any) => ({
      id: f.friend_id,
      friend: f.friends,
    })) || [];
    const friends2 = friendships2?.map((f: any) => ({
      id: f.user_id,
      friend: f.users,
    })) || [];

    const allFriends = [...friends1, ...friends2];
    const uniqueFriends = allFriends.filter(
      (item, index, self) =>
        index === self.findIndex((i) => i.id === item.id)
    );

    // Get last message and unread count for each friend
    const conversations: Conversation[] = await Promise.all(
      uniqueFriends.map(async (item) => {
        const friendId = item.id;

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
          )
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('sender_id', friendId)
          .eq('read', false);

        return {
          id: friendId,
          friend: item.friend as User,
          lastMessage: lastMessage as Message | undefined,
          unreadCount: count || 0,
          updated_at: lastMessage?.created_at || new Date().toISOString(),
        };
      })
    );

    // Sort by last message time (most recent first)
    return conversations.sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      return timeB - timeA;
    });
  },

  // Mark messages as read
  markAsRead: async (userId: string, friendId: string): Promise<void> => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', friendId)
      .eq('read', false);

    if (error) throw error;
  },

  // Get unread message count for a conversation
  getUnreadCount: async (userId: string, friendId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('sender_id', friendId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Send typing indicator
  sendTypingIndicator: (userId: string, friendId: string, isTyping: boolean) => {
    const channelName = `typing:${userId}:${friendId}`;
    let channel = supabase.channel(channelName);
    
    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId,
              friendId,
              isTyping,
            },
          });
        }
      });
  },

  // Setup typing indicator listener
  setupTypingListener: (
    userId: string,
    friendId: string,
    onTypingChange: (isTyping: boolean) => void
  ) => {
    const channelName = `typing:${friendId}:${userId}`; // Listen to friend's typing channel
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === friendId && payload.payload.friendId === userId) {
          onTypingChange(payload.payload.isTyping);
        }
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  // Setup read receipts listener
  setupReadReceiptsListener: (
    userId: string,
    friendId: string,
    onMessageRead: (messageId: string) => void
  ) => {
    const channelName = `read:${userId}:${friendId}`;
    const channel = supabase.channel(channelName);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Message;
          if (
            message.sender_id === userId &&
            message.receiver_id === friendId &&
            message.read === true
          ) {
            onMessageRead(message.id);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  // Setup realtime listener for new messages
  setupRealtimeListener: (
    userId: string,
    friendId: string,
    onNewMessage: (message: Message) => void
  ) => {
    // Create unique channel name
    const channelName = `messages:${userId}:${friendId}`;
    
    // Remove existing channel if any
    try {
      const existingChannel = supabase.channel(channelName);
      supabase.removeChannel(existingChannel);
    } catch (e) {
      // Ignore if channel doesn't exist
    }
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Message;
          console.log('Realtime message received:', message);
          
          // Filter messages for this conversation only
          if (
            (message.sender_id === friendId && message.receiver_id === userId) ||
            (message.sender_id === userId && message.receiver_id === friendId)
          ) {
            console.log('Message matches conversation, adding to list');
            onNewMessage(message);
          } else {
            console.log('Message does not match conversation, ignoring');
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error');
        }
      });

    return {
      unsubscribe: () => {
        console.log('Unsubscribing from realtime channel');
        supabase.removeChannel(channel);
      },
    };
  },
};

