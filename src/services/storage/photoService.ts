import { supabase } from '../api/supabase';
import { Photo, PhotoDump } from '../../types';
import { STORAGE_PATHS } from '../../utils/constants';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { friendService } from './friendService';

export interface UploadPhotoParams {
  uri: string;
  userId: string;
  friendId?: string;
  caption?: string;
  isStory?: boolean;
  isPhotoDump?: boolean;
  photoDumpId?: string;
}

// Compress và resize ảnh - Tối ưu chất lượng cao hơn
const compressImage = async (uri: string, maxWidth: number = 1920) => {
  const manipResult = await manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.92, format: SaveFormat.JPEG } // Tăng quality lên 0.92 và resolution 1920px
  );
  return manipResult.uri;
};

// Generate thumbnail - Chất lượng tốt hơn cho thumbnail
const generateThumbnail = async (uri: string) => {
  const manipResult = await manipulateAsync(
    uri,
    [{ resize: { width: 400 } }], // Tăng thumbnail size lên 400px
    { compress: 0.8, format: SaveFormat.JPEG } // Tăng quality lên 0.8
  );
  return manipResult.uri;
};

export const photoService = {
  // Upload photo
  uploadPhoto: async (params: UploadPhotoParams): Promise<Photo> => {
    const { uri, userId, friendId, caption, isStory, isPhotoDump, photoDumpId } = params;

    // Compress ảnh
    const compressedUri = await compressImage(uri);
    const thumbnailUri = await generateThumbnail(compressedUri);

    // Generate unique file names
    const timestamp = Date.now();
    const photoFileName = `${userId}/${timestamp}_photo.jpg`;
    const thumbnailFileName = `${userId}/${timestamp}_thumbnail.jpg`;

    // Read file as blob for upload
    const photoResponse = await fetch(compressedUri);
    const photoBlob = await photoResponse.blob();

    const thumbnailResponse = await fetch(thumbnailUri);
    const thumbnailBlob = await thumbnailResponse.blob();

    // Upload to Supabase Storage
    const { data: photoData, error: photoError } = await supabase.storage
      .from(STORAGE_PATHS.PHOTOS)
      .upload(photoFileName, photoBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (photoError) {
      // Handle bucket not found error
      if (photoError.message?.includes('Bucket not found') || photoError.message?.includes('not found')) {
        throw new Error('Storage bucket "photos" not found. Please create it in Supabase Dashboard → Storage. See QUICK_SETUP.md for instructions.');
      }
      console.error('Photo upload error:', photoError);
      throw photoError;
    }

    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from(STORAGE_PATHS.THUMBNAILS)
      .upload(thumbnailFileName, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (thumbnailError) {
      // Handle bucket not found error
      if (thumbnailError.message?.includes('Bucket not found') || thumbnailError.message?.includes('not found')) {
        throw new Error('Storage bucket "thumbnails" not found. Please create it in Supabase Dashboard → Storage. See QUICK_SETUP.md for instructions.');
      }
      console.error('Thumbnail upload error:', thumbnailError);
      throw thumbnailError;
    }

    // Get public URLs
    const { data: photoUrlData } = supabase.storage
      .from(STORAGE_PATHS.PHOTOS)
      .getPublicUrl(photoFileName);

    const { data: thumbnailUrlData } = supabase.storage
      .from(STORAGE_PATHS.THUMBNAILS)
      .getPublicUrl(thumbnailFileName);

    // Calculate expiration date for stories
    let expiresAt: string | undefined;
    if (isStory) {
      const expiresDate = new Date();
      expiresDate.setHours(expiresDate.getHours() + 24);
      expiresAt = expiresDate.toISOString();
    }

    // Save photo metadata to database
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        user_id: userId,
        friend_id: friendId || null,
        storage_path: photoUrlData.publicUrl,
        thumbnail_path: thumbnailUrlData.publicUrl,
        caption,
        type: 'photo',
        is_story: isStory || false,
        is_photo_dump: isPhotoDump || false,
        photo_dump_id: photoDumpId || null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Create notifications for friends
    try {
      await createNotificationsForFriends(userId, photo.id, isStory || false);
    } catch (notifError) {
      // Don't fail upload if notification creation fails
      console.error('Error creating notifications:', notifError);
    }

    return photo as Photo;
  },

  // Cache for friend IDs to reduce repeated queries
  _friendIdsCache: null as { data: string[]; timestamp: number; userId: string } | null,
  _friendIdsCacheDuration: 60000, // 1 minute

  // Get friend IDs with caching
  _getFriendIds: async (userId: string): Promise<string[]> => {
    const now = Date.now();
    const cache = photoService._friendIdsCache;
    
    if (
      cache &&
      cache.userId === userId &&
      now - cache.timestamp < photoService._friendIdsCacheDuration
    ) {
      return cache.data;
    }

    // Parallel queries for friendships (faster)
    const [friendships1Result, friendships2Result] = await Promise.all([
      supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', userId)
        .eq('status', 'accepted'),
    ]);

    if (friendships1Result.error) throw friendships1Result.error;
    if (friendships2Result.error) throw friendships2Result.error;

    const friendIds1 = friendships1Result.data?.map(f => f.friend_id) || [];
    const friendIds2 = friendships2Result.data?.map(f => f.user_id) || [];
    const allFriendIds = [...friendIds1, ...friendIds2];
    const uniqueFriendIds = Array.from(new Set(allFriendIds));

    // Update cache
    photoService._friendIdsCache = {
      data: uniqueFriendIds,
      timestamp: now,
      userId,
    };

    return uniqueFriendIds;
  },

  // Get photos from friends and own photos - Optimized với caching
  getPhotos: async (userId: string, limit: number = 50): Promise<Photo[]> => {
    // Get friend IDs with caching
    const uniqueFriendIds = await photoService._getFriendIds(userId);
    
    // Include own user ID to get own photos too
    const allUserIds = [userId, ...uniqueFriendIds];

    // Get photos from user and friends (not stories that expired, not photo dumps that expired)
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .in('user_id', allUserIds)
      .or('friend_id.is.null,friend_id.eq.' + userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .eq('is_story', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return photos as Photo[];
  },

  // Get stories from user and friends - Optimized với caching
  getStories: async (userId: string): Promise<Photo[]> => {
    // Get friend IDs with caching (reuse the same cache)
    const uniqueFriendIds = await photoService._getFriendIds(userId);
    
    // Include own user ID to get own stories too
    const allUserIds = [userId, ...uniqueFriendIds];

    const { data: stories, error } = await supabase
      .from('photos')
      .select('*')
      .in('user_id', allUserIds)
      .eq('is_story', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return stories as Photo[];
  },

  // Delete photo
  deletePhoto: async (photoId: string, userId: string): Promise<void> => {
    // Verify ownership
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('storage_path, thumbnail_path')
      .eq('id', photoId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !photo) throw new Error('Photo not found or unauthorized');

    // Delete from storage
    const photoPath = photo.storage_path.split('/').pop();
    const thumbnailPath = photo.thumbnail_path?.split('/').pop();

    if (photoPath) {
      await supabase.storage.from(STORAGE_PATHS.PHOTOS).remove([photoPath]);
    }
    if (thumbnailPath) {
      await supabase.storage.from(STORAGE_PATHS.THUMBNAILS).remove([thumbnailPath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  },
};

// Helper function to create notifications for friends
const createNotificationsForFriends = async (
  userId: string,
  photoId: string,
  isStory: boolean
) => {
  try {
    // Get all friends
    const friends = await friendService.getFriends(userId);
    
    if (friends.length === 0) return;

    // Get user info for notification message
    const { data: user } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();

    const userName = user?.username || user?.email?.split('@')[0] || 'Ai đó';
    const notificationType = isStory ? 'story' : 'photo';
    const message = isStory 
      ? `${userName} đã đăng story mới`
      : `${userName} đã chia sẻ ảnh mới`;

    // Create notifications for all friends
    const notifications = friends.map(friend => ({
      user_id: friend.id,
      from_user_id: userId,
      type: notificationType,
      photo_id: photoId,
      message,
      read: false,
    }));

    // Insert notifications in batch
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error inserting notifications:', error);
    }
  } catch (error) {
    console.error('Error creating notifications for friends:', error);
  }
};

