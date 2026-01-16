// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Friendship types
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

// Photo types
export interface Photo {
  id: string;
  user_id: string;
  friend_id?: string; // null nếu gửi cho tất cả bạn bè
  storage_path: string;
  thumbnail_path?: string;
  caption?: string;
  type: 'photo' | 'video' | 'voice';
  duration?: number; // cho video/voice (seconds)
  expires_at?: string; // cho Stories 24h
  is_story: boolean;
  is_photo_dump: boolean;
  photo_dump_id?: string;
  created_at: string;
}

// Photo Dump types
export interface PhotoDump {
  id: string;
  user_id: string;
  week: number; // week number of year
  year: number;
  created_at: string;
  expires_at: string;
  photos: Photo[];
}

// Reaction types
export interface Reaction {
  id: string;
  photo_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// Widget settings
export interface WidgetSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'custom';
  primary_color?: string;
  layout: 'grid' | 'list';
  max_photos: number;
  show_stories: boolean;
  updated_at: string;
}

// Message types
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'photo' | 'video' | 'voice';
  media_url?: string;
  read: boolean;
  created_at: string;
}

// Conversation type (for displaying conversations list)
export interface Conversation {
  id: string; // friend_id
  friend: User;
  lastMessage?: Message;
  unreadCount: number;
  updated_at: string;
}

