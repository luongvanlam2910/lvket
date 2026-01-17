import { supabase } from '../api/supabase';
import { Message, Conversation, User } from '../../types';

// Cache for conversations to reduce database calls
let conversationsCache: { data: Conversation[] | null; timestamp: number; userId: string | null } = {
  data: null,
  timestamp: 0,
  userId: null,
};
const CACHE_DURATION = 30000; // 30 seconds

export const messageService = {
  // Send a message - Optimized with instant broadcast
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

    // Broadcast message instantly for real-time delivery (không cần chờ postgres_changes)
    const channelName = `instant:${senderId}:${receiverId}`;
    const channel = supabase.channel(channelName);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: data,
        });
        // Unsubscribe after sending
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });

    // Create notification for receiver (non-blocking)
    supabase.from('notifications').insert({
      user_id: receiverId,
      from_user_id: senderId,
      type: 'message',
      message_id: data.id,
      message: type === 'text' ? content : `Đã gửi ${type === 'photo' ? 'ảnh' : type === 'video' ? 'video' : 'tin nhắn thoại'}`,
      read: false,
    }).then(() => {}).catch(console.error);

    // Invalidate cache
    conversationsCache.data = null;

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

  // Get conversations list - Optimized với caching và parallel queries
  getConversations: async (userId: string, forceRefresh: boolean = false): Promise<Conversation[]> => {
    // Check cache first
    const now = Date.now();
    if (
      !forceRefresh &&
      conversationsCache.data &&
      conversationsCache.userId === userId &&
      now - conversationsCache.timestamp < CACHE_DURATION
    ) {
      return conversationsCache.data;
    }

    // Parallel queries for friendships (faster than sequential)
    const [friendships1Result, friendships2Result] = await Promise.all([
      supabase
        .from('friendships')
        .select('friend_id, friends:friend_id(*)')
        .eq('user_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('friendships')
        .select('user_id, users:user_id(*)')
        .eq('friend_id', userId)
        .eq('status', 'accepted'),
    ]);

    if (friendships1Result.error) throw friendships1Result.error;
    if (friendships2Result.error) throw friendships2Result.error;

    // Combine friends from both directions
    const friends1 = friendships1Result.data?.map((f: any) => ({
      id: f.friend_id,
      friend: f.friends,
    })) || [];
    const friends2 = friendships2Result.data?.map((f: any) => ({
      id: f.user_id,
      friend: f.users,
    })) || [];

    const allFriends = [...friends1, ...friends2];
    const uniqueFriends = allFriends.filter(
      (item, index, self) =>
        index === self.findIndex((i) => i.id === item.id)
    );

    // Batch query for all conversations (much faster than individual queries)
    const friendIds = uniqueFriends.map((f) => f.id);
    
    // Get all messages in parallel
    const [lastMessagesResult, unreadCountsResult] = await Promise.all([
      // Get last messages for all friends in one query
      supabase.rpc('get_last_messages', { 
        p_user_id: userId, 
        p_friend_ids: friendIds 
      }).catch(() => ({ data: null, error: null })),
      
      // Get unread counts for all friends
      supabase
        .from('messages')
        .select('sender_id', { count: 'exact' })
        .eq('receiver_id', userId)
        .eq('read', false)
        .in('sender_id', friendIds),
    ]);

    // If RPC doesn't exist, fallback to parallel individual queries
    let lastMessagesMap: Record<string, Message | undefined> = {};
    let unreadCountsMap: Record<string, number> = {};

    if (!lastMessagesResult.data) {
      // Fallback: Parallel queries for each friend
      const results = await Promise.all(
        uniqueFriends.map(async (item) => {
          const friendId = item.id;
          const [lastMsgResult, countResult] = await Promise.all([
            supabase
              .from('messages')
              .select('*')
              .or(
                `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
              )
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('receiver_id', userId)
              .eq('sender_id', friendId)
              .eq('read', false),
          ]);
          return {
            friendId,
            lastMessage: lastMsgResult.data,
            unreadCount: countResult.count || 0,
          };
        })
      );
      
      results.forEach((r) => {
        lastMessagesMap[r.friendId] = r.lastMessage || undefined;
        unreadCountsMap[r.friendId] = r.unreadCount;
      });
    } else {
      // Use RPC results
      (lastMessagesResult.data as any[])?.forEach((msg: any) => {
        lastMessagesMap[msg.friend_id] = msg;
      });
    }

    // Build conversations
    const conversations: Conversation[] = uniqueFriends.map((item) => ({
      id: item.id,
      friend: item.friend as User,
      lastMessage: lastMessagesMap[item.id],
      unreadCount: unreadCountsMap[item.id] || 0,
      updated_at: lastMessagesMap[item.id]?.created_at || new Date().toISOString(),
    }));

    // Sort by last message time (most recent first)
    const sortedConversations = conversations.sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      return timeB - timeA;
    });

    // Update cache
    conversationsCache = {
      data: sortedConversations,
      timestamp: now,
      userId,
    };

    return sortedConversations;
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

  // Setup realtime listener for new messages - Optimized với instant broadcast
  setupRealtimeListener: (
    userId: string,
    friendId: string,
    onNewMessage: (message: Message) => void
  ) => {
    // Track processed message IDs to avoid duplicates
    const processedIds = new Set<string>();
    
    const handleMessage = (message: Message) => {
      if (processedIds.has(message.id)) return;
      processedIds.add(message.id);
      
      // Clean up old IDs (keep last 100)
      if (processedIds.size > 100) {
        const arr = Array.from(processedIds);
        arr.slice(0, arr.length - 100).forEach((id) => processedIds.delete(id));
      }
      
      onNewMessage(message);
    };

    // Create unique channel names
    const dbChannelName = `messages:${userId}:${friendId}`;
    const instantChannelName = `instant:${friendId}:${userId}`; // Listen to friend's instant channel
    
    // Remove existing channels if any
    try {
      supabase.removeChannel(supabase.channel(dbChannelName));
      supabase.removeChannel(supabase.channel(instantChannelName));
    } catch (e) {}
    
    // 1. Listen for instant broadcast (faster, ~50ms delay)
    const instantChannel = supabase
      .channel(instantChannelName)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const message = payload.payload as Message;
        if (
          (message.sender_id === friendId && message.receiver_id === userId) ||
          (message.sender_id === userId && message.receiver_id === friendId)
        ) {
          handleMessage(message);
        }
      })
      .subscribe();
    
    // 2. Listen for database changes (backup, ~1-2s delay)
    const dbChannel = supabase
      .channel(dbChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Message;
          
          // Filter messages for this conversation only
          if (
            (message.sender_id === friendId && message.receiver_id === userId) ||
            (message.sender_id === userId && message.receiver_id === friendId)
          ) {
            handleMessage(message);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(instantChannel);
        supabase.removeChannel(dbChannel);
      },
    };
  },

  // Clear cache (call when needed)
  clearCache: () => {
    conversationsCache.data = null;
  },
};

