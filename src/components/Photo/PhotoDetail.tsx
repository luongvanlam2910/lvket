import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  PanResponder,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { Photo, Reaction, User } from '../../types';
import { supabase } from '../../services/api/supabase';
import { authService } from '../../services/auth/authService';
import { photoService } from '../../services/storage/photoService';

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
  onDelete?: () => void;
}

interface ReactionWithUser extends Reaction {
  user: User;
}

const EMOJIS = ['❤️', '😊', '🔥', '👍', '😍'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PhotoDetail({ photo, onClose, onDelete }: PhotoDetailProps) {
  const navigation = useNavigation();
  const [reactions, setReactions] = useState<ReactionWithUser[]>([]);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [photoOwner, setPhotoOwner] = useState<User | null>(null);
  const [showReactionsList, setShowReactionsList] = useState(false);
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0);
  const swipeX = useRef(new Animated.Value(0)).current;
  const isSwiping = useRef(false);

  useEffect(() => {
    loadReactions();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setUserId(user?.id || null);
  };

  const loadReactions = async () => {
    try {
      // Load reactions with user info
      const { data, error } = await supabase
        .from('reactions')
        .select(`
          *,
          user:users!reactions_user_id_fkey (
            id,
            username,
            email,
            avatar_url
          )
        `)
        .eq('photo_id', photo.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReactions((data || []) as ReactionWithUser[]);

      // Get user's reaction
      const user = await authService.getCurrentUser();
      if (user) {
        const userReact = (data || []).find((r: any) => r.user_id === user.id);
        if (userReact) {
          // Extract just the reaction data (without user nested object for userReaction)
          setUserReaction({
            id: userReact.id,
            photo_id: userReact.photo_id,
            user_id: userReact.user_id,
            emoji: userReact.emoji,
            created_at: userReact.created_at,
          });
        } else {
          setUserReaction(null);
        }
      }

      // Load photo owner info
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', photo.user_id)
        .single();

      if (!ownerError && ownerData) {
        setPhotoOwner(ownerData as User);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      if (userReaction) {
        // Remove existing reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('id', userReaction.id);
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            photo_id: photo.id,
            user_id: userId,
            emoji,
          });

        if (error) throw error;
      }
      
      // Reload reactions to get updated data with user info
      await loadReactions();
    } catch (error) {
      console.error('Error reacting:', error);
      Alert.alert('Error', 'Failed to react');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!userId || photo.user_id !== userId) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoService.deletePhoto(photo.id, userId);
              onDelete?.();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleReply = () => {
    if (!photoOwner || !userId || photoOwner.id === userId) return;
    
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Chat', { 
        friend: photoOwner,
        replyPhoto: photo 
      });
      onClose();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isSignificant = Math.abs(gestureState.dx) > 20;
        return isHorizontal && isSignificant;
      },
      onPanResponderGrant: () => {
        isSwiping.current = true;
        swipeX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isSwiping.current) {
          const clampedDx = Math.max(-SCREEN_WIDTH * 0.3, Math.min(SCREEN_WIDTH * 0.3, gestureState.dx));
          swipeX.setValue(clampedDx);
          
          // Calculate selected emoji index based on swipe
          const emojiWidth = SCREEN_WIDTH / EMOJIS.length;
          const newIndex = Math.max(0, Math.min(EMOJIS.length - 1, 
            Math.floor((SCREEN_WIDTH / 2 + gestureState.dx) / emojiWidth)
          ));
          setSelectedEmojiIndex(newIndex);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        isSwiping.current = false;
        const swipeThreshold = 50;
        
        if (Math.abs(gestureState.dx) > swipeThreshold) {
          // Swipe detected - select and react with emoji
          handleReaction(EMOJIS[selectedEmojiIndex]);
        }
        
        // Reset position
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        isSwiping.current = false;
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const renderReactionItem = ({ item }: { item: ReactionWithUser }) => (
    <View style={styles.reactionUserItem}>
      {item.user.avatar_url ? (
        <Image source={{ uri: item.user.avatar_url }} style={styles.reactionUserAvatar} />
      ) : (
        <View style={styles.reactionUserAvatarPlaceholder}>
          <Text style={styles.reactionUserAvatarText}>
            {item.user.username?.[0]?.toUpperCase() || item.user.email[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.reactionUserInfo}>
        <Text style={styles.reactionUserName}>
          {item.user.username || item.user.email}
        </Text>
        <Text style={styles.reactionUserEmoji}>{item.emoji}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Image
          source={{ uri: photo.storage_path }}
          style={styles.image}
          resizeMode="contain"
        />
        
        {/* Header Overlay with Gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              {photoOwner && photoOwner.id !== userId && (
                <TouchableOpacity onPress={handleReply} style={styles.replyButton}>
                  <Text style={styles.replyButtonText}>💬 Reply</Text>
                </TouchableOpacity>
              )}
              {userId === photo.user_id && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Info Overlay - Bottom with Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.infoGradient}
        >
          <View style={styles.infoOverlay}>
            {photoOwner && (
              <View style={styles.ownerContainer}>
                {photoOwner.avatar_url ? (
                  <Image source={{ uri: photoOwner.avatar_url }} style={styles.ownerAvatar} />
                ) : (
                  <View style={styles.ownerAvatarPlaceholder}>
                    <Text style={styles.ownerAvatarText}>
                      {photoOwner.username?.[0]?.toUpperCase() || photoOwner.email[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>
                    {photoOwner.username || photoOwner.email}
                  </Text>
                  <Text style={styles.ownerTime}>{formatDate(photo.created_at)}</Text>
                </View>
              </View>
            )}

            {photo.caption && (
              <View style={styles.captionContainer}>
                <Text style={styles.caption}>{photo.caption}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
        
        {/* Reactions Count Button - Bottom Left */}
        {reactions.length > 0 && (
          <TouchableOpacity
            style={styles.reactionsCountButton}
            onPress={() => setShowReactionsList(true)}
          >
            <Text style={styles.reactionsCountEmoji}>
              {reactions[0]?.emoji || '❤️'}
            </Text>
            <Text style={styles.reactionsCountText}>
              {reactions.length}
            </Text>
          </TouchableOpacity>
        )}

        {/* Floating Reaction Buttons - Bottom Right */}
        <Animated.View 
          style={[
            styles.floatingReactions,
            {
              transform: [{ translateX: swipeX }],
            },
          ]}
        >
          {EMOJIS.map((emoji, index) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.floatingReactionButton,
                index === selectedEmojiIndex && styles.floatingReactionButtonActive,
                userReaction?.emoji === emoji && styles.floatingReactionButtonSelected,
              ]}
              onPress={() => handleReaction(emoji)}
              disabled={loading}
            >
              <Text style={styles.floatingReactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Reactions List Modal */}
      <Modal
        visible={showReactionsList}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReactionsList(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReactionsList(false)}
        >
          <View style={styles.reactionsListModal}>
            <View style={styles.reactionsListHeader}>
              <Text style={styles.reactionsListTitle}>
                Reactions ({reactions.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowReactionsList(false)}
                style={styles.closeModalButton}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={reactions}
              renderItem={renderReactionItem}
              keyExtractor={(item) => item.id}
              style={styles.reactionsListContent}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 30,
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  replyButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingTop: 60,
  },
  infoOverlay: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  floatingReactions: {
    position: 'absolute',
    bottom: 130,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  floatingReactionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  floatingReactionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    transform: [{ scale: 1.2 }],
    borderColor: 'transparent',
  },
  floatingReactionButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingReactionEmoji: {
    fontSize: 22,
  },
  reactionsCountButton: {
    position: 'absolute',
    bottom: 130,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 5,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  reactionsCountEmoji: {
    fontSize: 18,
  },
  reactionsCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#1A1A1A',
    paddingBottom: 40,
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ownerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ownerAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ownerTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  captionContainer: {
    marginTop: 10,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  reactionsListModal: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  reactionsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  reactionsListTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeModalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  reactionsListContent: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  reactionUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  reactionUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: '#444',
  },
  reactionUserAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reactionUserAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reactionUserInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactionUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reactionUserEmoji: {
    fontSize: 24,
  },
});

