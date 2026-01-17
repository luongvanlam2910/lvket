import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Photo, User, Reaction } from '../../types';
import { supabase } from '../../services/api/supabase';
import { authService } from '../../services/auth/authService';
import { messageService } from '../../services/storage/messageService';

interface PhotoFeedItemProps {
  photo: Photo;
  photoOwner: User;
  currentUserId: string;
  onPress?: () => void;
}

const QUICK_REACTIONS = ['🔥', '❤️', '💛'];

export default function PhotoFeedItem({ 
  photo, 
  photoOwner, 
  currentUserId,
  onPress 
}: PhotoFeedItemProps) {
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [photo.id]);

  const loadReactions = async () => {
    try {
      const { data: reactions } = await supabase
        .from('reactions')
        .select('*')
        .eq('photo_id', photo.id);

      if (reactions) {
        setReactionCount(reactions.length);
        const myReaction = reactions.find(r => r.user_id === currentUserId);
        setUserReaction(myReaction || null);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    try {
      if (userReaction) {
        // Remove reaction if same emoji, or replace if different
        if (userReaction.emoji === emoji) {
          await supabase
            .from('reactions')
            .delete()
            .eq('id', userReaction.id);
          setUserReaction(null);
          setReactionCount(prev => Math.max(0, prev - 1));
        } else {
          await supabase
            .from('reactions')
            .update({ emoji })
            .eq('id', userReaction.id);
          setUserReaction({ ...userReaction, emoji });
        }
      } else {
        // Add new reaction
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            photo_id: photo.id,
            user_id: currentUserId,
            emoji,
          })
          .select()
          .single();

        if (data) {
          setUserReaction(data);
          setReactionCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      await messageService.sendMessage(
        currentUserId,
        photoOwner.id,
        replyText.trim(),
        'text'
      );
      setReplyText('');
      setShowInput(false);
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={onPress}
        activeOpacity={0.95}
      >
        <Image
          source={{ uri: photo.storage_path }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* User info overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.userInfo}>
            {photoOwner.avatar_url ? (
              <Image
                source={{ uri: photoOwner.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {photoOwner.username?.[0]?.toUpperCase() || photoOwner.email[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userTextInfo}>
              <Text style={styles.username}>
                {photoOwner.username || photoOwner.email.split('@')[0]}
              </Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(photo.created_at)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Caption */}
        {photo.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{photo.caption}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Reactions & Reply Input */}
      <View style={styles.actionsContainer}>
        {/* Quick Reactions */}
        <View style={styles.reactionsContainer}>
          {QUICK_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionButton,
                userReaction?.emoji === emoji && styles.reactionButtonActive,
              ]}
              onPress={() => handleQuickReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reply Input */}
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Gửi tin nhắn..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={replyText}
            onChangeText={setReplyText}
            onFocus={() => setShowInput(true)}
            multiline={false}
          />
          {replyText.trim() && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendReply}
              disabled={sendingReply}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Gửi</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: '#000',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  userInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  userTextInfo: {
    marginLeft: 10,
  },
  username: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    right: 12,
  },
  caption: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reactionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

