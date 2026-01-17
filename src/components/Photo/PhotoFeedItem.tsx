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
        activeOpacity={0.98}
      >
        <Image
          source={{ uri: photo.storage_path }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* User info at top */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
        >
          <View style={styles.userInfoTop}>
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

        {/* Caption at bottom */}
        {photo.caption && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bottomGradient}
          >
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>{photo.caption}</Text>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Actions: Reply Input with Quick Reactions on the right */}
      <View style={styles.actionsContainer}>
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Send message..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={replyText}
            onChangeText={setReplyText}
            multiline={false}
          />
          {/* Quick Reactions on the right */}
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
          {replyText.trim() && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendReply}
              disabled={sendingReply}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendIcon}>📤</Text>
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
    marginBottom: 0,
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 50,
  },
  userInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  userTextInfo: {
    marginLeft: 10,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  captionContainer: {
    paddingHorizontal: 16,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  reactionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  reactionEmoji: {
    fontSize: 18,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
  },
});
