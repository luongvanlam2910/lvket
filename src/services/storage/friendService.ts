import { supabase } from '../api/supabase';
import { Friendship, User } from '../../types';
import { MAX_FRIENDS } from '../../utils/constants';

export const friendService = {
  // Send friend request
  sendFriendRequest: async (userId: string, friendId: string): Promise<Friendship> => {
    // Check if already friends or request exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    if (existing) {
      throw new Error('Friendship already exists');
    }

    // Check friend limit
    const { count } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (count && count >= MAX_FRIENDS) {
      throw new Error(`Maximum ${MAX_FRIENDS} friends allowed`);
    }

    // Create friend request
    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return friendship as Friendship;
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .eq('friend_id', userId);

    if (error) throw error;
  },

  // Accept friend request by user ID (alternative method)
  acceptFriendRequestByUserId: async (requestUserId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('user_id', requestUserId)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
  },

  // Get friends list (both directions)
  getFriends: async (userId: string): Promise<User[]> => {
    // Get friendships where user is the requester
    const { data: friendships1, error: error1 } = await supabase
      .from('friendships')
      .select('friend_id, friends:friend_id(*)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error1) throw error1;

    // Get friendships where user is the friend (accepted requests)
    const { data: friendships2, error: error2 } = await supabase
      .from('friendships')
      .select('user_id, users:user_id(*)')
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (error2) throw error2;

    // Combine both lists
    const friends1 = friendships1?.map((f: any) => f.friends).filter(Boolean) || [];
    const friends2 = friendships2?.map((f: any) => f.users).filter(Boolean) || [];
    
    // Merge and remove duplicates
    const allFriends = [...friends1, ...friends2];
    const uniqueFriends = allFriends.filter((friend, index, self) =>
      index === self.findIndex((f) => f.id === friend.id)
    );
    
    return uniqueFriends as User[];
  },

  // Get pending friend requests
  getPendingRequests: async (userId: string): Promise<Array<{ friendship: Friendship; user: User }>> => {
    const { data: requests, error } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at, users:user_id(*)')
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    const result = requests?.map((r: any) => ({
      friendship: {
        id: r.id,
        user_id: r.user_id,
        friend_id: r.friend_id,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.created_at,
      } as Friendship,
      user: r.users as User,
    })).filter((r: any) => r.user) || [];
    return result;
  },

  // Search users
  searchUsers: async (query: string, excludeUserId: string): Promise<User[]> => {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${query}%,username.ilike.%${query}%`)
      .neq('id', excludeUserId)
      .limit(20);

    if (error) throw error;
    return users as User[];
  },

  // Remove friend
  removeFriend: async (userId: string, friendId: string): Promise<void> => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    if (error) throw error;
  },
};

