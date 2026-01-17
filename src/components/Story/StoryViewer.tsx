import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Photo, User } from '../../types';
import { supabase } from '../../services/api/supabase';
import { photoService } from '../../services/storage/photoService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoryGroup {
  user: User;
  stories: Photo[];
}

interface StoryViewerProps {
  visible: boolean;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  currentUserId: string | null;
  onClose: () => void;
  onStoryDeleted: (storyId: string) => void;
}

export default function StoryViewer({
  visible,
  storyGroups,
  initialGroupIndex,
  currentUserId,
  onClose,
  onStoryDeleted,
}: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const videoRef = useRef<Video>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isVideo = currentStory?.type === 'video';
  const isOwnStory = currentStory?.user_id === currentUserId;

  useEffect(() => {
    if (visible) {
      setCurrentGroupIndex(initialGroupIndex);
      setCurrentStoryIndex(0);
    }
  }, [visible, initialGroupIndex]);

  useEffect(() => {
    if (visible && currentStory && !isPaused && !isVideo) {
      startProgress();
    }
    return () => {
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [visible, currentGroupIndex, currentStoryIndex, isPaused, isVideo]);

  const startProgress = (duration: number = STORY_DURATION) => {
    progressAnim.setValue(0);
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    progressAnimation.current.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  };

  const goToNextStory = () => {
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      // Next story in same group
      setCurrentStoryIndex(currentStoryIndex + 1);
      setLoading(true);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      // Next group
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentStoryIndex(0);
      setLoading(true);
    } else {
      // End of all stories
      onClose();
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      // Previous story in same group
      setCurrentStoryIndex(currentStoryIndex - 1);
      setLoading(true);
    } else if (currentGroupIndex > 0) {
      // Previous group (last story)
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setLoading(true);
    }
  };

  const handlePress = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    if (touchX < SCREEN_WIDTH / 3) {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  };

  const handleLongPressIn = () => {
    setIsPaused(true);
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    if (videoRef.current && isVideo) {
      videoRef.current.pauseAsync();
    }
  };

  const handleLongPressOut = () => {
    setIsPaused(false);
    if (videoRef.current && isVideo) {
      videoRef.current.playAsync();
    }
  };

  const handleDeleteStory = () => {
    if (!currentStory || !currentUserId) return;

    Alert.alert(
      'Xóa Story',
      'Bạn có chắc muốn xóa story này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoService.deletePhoto(currentStory.id, currentUserId);
              onStoryDeleted(currentStory.id);
              
              // Navigate to next story or close
              if (currentGroup.stories.length === 1) {
                // Last story in group
                if (storyGroups.length === 1) {
                  onClose();
                } else {
                  goToNextStory();
                }
              } else {
                goToNextStory();
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa story');
            }
          },
        },
      ]
    );
  };

  const handleVideoPlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        goToNextStory();
      }
      if (status.durationMillis && !isPaused && loading === false) {
        // Start progress based on video duration
        if (progressAnimation.current) {
          progressAnimation.current.stop();
        }
        startProgress(status.durationMillis);
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h`;
    } else if (diffMins > 0) {
      return `${diffMins}m`;
    } else {
      return 'Vừa xong';
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down to close
          onClose();
        }
      },
    })
  ).current;

  if (!visible || !currentGroup || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {currentGroup.stories.map((_, index) => (
            <View key={index} style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width:
                      index < currentStoryIndex
                        ? '100%'
                        : index === currentStoryIndex
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              {currentGroup.user.avatar_url ? (
                <Image
                  source={{ uri: currentGroup.user.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {currentGroup.user.username?.[0]?.toUpperCase() ||
                      currentGroup.user.email[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userTextInfo}>
                <Text style={styles.username}>
                  {currentGroup.user.username || currentGroup.user.email.split('@')[0]}
                </Text>
                <Text style={styles.timeAgo}>
                  {formatTimeAgo(currentStory.created_at)}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {isOwnStory && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteStory}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Story Content */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.contentContainer}
          onPress={handlePress}
          onLongPress={handleLongPressIn}
          onPressOut={handleLongPressOut}
          delayLongPress={200}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {isVideo ? (
            <Video
              ref={videoRef}
              source={{ uri: currentStory.storage_path }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={!isPaused}
              isLooping={false}
              onPlaybackStatusUpdate={handleVideoPlaybackStatus}
              onLoad={() => setLoading(false)}
            />
          ) : (
            <Image
              source={{ uri: currentStory.storage_path }}
              style={styles.media}
              resizeMode="contain"
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => {
                setLoading(false);
                if (!isPaused) {
                  startProgress();
                }
              }}
            />
          )}
        </TouchableOpacity>

        {/* Caption */}
        {currentStory.caption && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.captionGradient}
          >
            <Text style={styles.caption}>{currentStory.caption}</Text>
          </LinearGradient>
        )}

        {/* Video indicator */}
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Text style={styles.videoIndicatorText}>🎥</Text>
          </View>
        )}

        {/* Navigation hint */}
        <View style={styles.navigationHint}>
          <View style={styles.navHintLeft} />
          <View style={styles.navHintRight} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 50,
    gap: 4,
    zIndex: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 40,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginLeft: 12,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,59,48,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  captionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoIndicator: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicatorText: {
    fontSize: 16,
  },
  navigationHint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    pointerEvents: 'none',
  },
  navHintLeft: {
    flex: 1,
  },
  navHintRight: {
    flex: 2,
  },
});

