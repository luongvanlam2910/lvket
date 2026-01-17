import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { photoService } from '../../services/storage/photoService';
import { authService } from '../../services/auth/authService';
import { supabase } from '../../services/api/supabase';
import { Photo, User } from '../../types';
import StoryViewer from '../../components/Story/StoryViewer';

const { width } = Dimensions.get('window');
const STORY_CARD_WIDTH = (width - 48) / 2;

interface StoryGroup {
  user: User;
  stories: Photo[];
}

// Memoized Story Card Component
const StoryCard = memo(({ 
  group, 
  onPress,
  isOwn,
}: { 
  group: StoryGroup; 
  onPress: () => void;
  isOwn: boolean;
}) => {
  const latestStory = group.stories[0];
  const isVideo = latestStory.type === 'video';

  return (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: latestStory.thumbnail_path || latestStory.storage_path }}
        style={styles.storyImage}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />

      {/* Video indicator */}
      {isVideo && (
        <View style={styles.videoIndicator}>
          <Text style={styles.videoIcon}>🎥</Text>
        </View>
      )}

      {/* Story count badge */}
      {group.stories.length > 1 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{group.stories.length}</Text>
        </View>
      )}

      {/* Own story badge */}
      {isOwn && (
        <View style={styles.ownBadge}>
          <Text style={styles.ownBadgeText}>Của bạn</Text>
        </View>
      )}

      {/* User info */}
      <View style={styles.userInfoOverlay}>
        {group.user.avatar_url ? (
          <Image
            source={{ uri: group.user.avatar_url }}
            style={styles.userAvatar}
          />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {group.user.username?.[0]?.toUpperCase() || group.user.email[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.userName} numberOfLines={1}>
          {isOwn ? 'Story của bạn' : group.user.username || group.user.email.split('@')[0]}
        </Text>
        <Text style={styles.storyTime}>
          {formatTimeAgo(latestStory.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// Helper function
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h trước`;
  } else if (diffMins > 0) {
    return `${diffMins}m trước`;
  } else {
    return 'Vừa xong';
  }
};

export default function StoriesScreen({ navigation }: any) {
  const [stories, setStories] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, 60000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [])
  );

  const loadStories = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      setUserId(user.id);
      const userStories = await photoService.getStories(user.id);
      setStories(userStories);

      // Load user info for all story owners
      const userIds = [...new Set(userStories.map(s => s.user_id))];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (usersData) {
          const usersMap: Record<string, User> = {};
          usersData.forEach(u => {
            usersMap[u.id] = u as User;
          });
          setUsers(usersMap);
        }
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStories();
  }, []);

  // Group stories by user
  const storyGroups: StoryGroup[] = useMemo(() => {
    const groups: Record<string, Photo[]> = {};
    
    // Group stories by user
    stories.forEach(story => {
      if (!groups[story.user_id]) {
        groups[story.user_id] = [];
      }
      groups[story.user_id].push(story);
    });

    // Convert to array and sort (own stories first, then by latest)
    const result: StoryGroup[] = Object.entries(groups)
      .map(([userId, userStories]) => ({
        user: users[userId] || {
          id: userId,
          email: 'user@example.com',
          created_at: '',
          updated_at: '',
        },
        stories: userStories.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }))
      .sort((a, b) => {
        // Own stories first
        if (a.user.id === userId) return -1;
        if (b.user.id === userId) return 1;
        // Then by latest story
        return new Date(b.stories[0].created_at).getTime() - 
               new Date(a.stories[0].created_at).getTime();
      });

    return result;
  }, [stories, users, userId]);

  const handleStoryPress = useCallback((groupIndex: number) => {
    setSelectedGroupIndex(groupIndex);
    setViewerVisible(true);
  }, []);

  const handleStoryDeleted = useCallback((storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
  }, []);

  const renderStoryCard = useCallback(({ item, index }: { item: StoryGroup; index: number }) => (
    <StoryCard
      group={item}
      onPress={() => handleStoryPress(index)}
      isOwn={item.user.id === userId}
    />
  ), [userId, handleStoryPress]);

  const keyExtractor = useCallback((item: StoryGroup) => item.user.id, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Stories</Text>
          <Text style={styles.headerSubtitle}>
            {storyGroups.length} người có story • {stories.length} story
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addStoryButton}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Camera', { storyMode: true });
            }
          }}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addStoryGradient}
          >
            <Text style={styles.addStoryButtonText}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {storyGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
          </View>
          <Text style={styles.emptyText}>Chưa có story nào</Text>
          <Text style={styles.emptySubtext}>
            Story từ bạn bè sẽ xuất hiện ở đây.{'\n'}
            Story sẽ tự động biến mất sau 24 giờ.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Camera', { storyMode: true });
              }
            }}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonText}>Tạo Story đầu tiên</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={storyGroups}
          keyExtractor={keyExtractor}
          renderItem={renderStoryCard}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#667eea"
            />
          }
          showsVerticalScrollIndicator={false}
          // Performance
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={5}
        />
      )}

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={viewerVisible}
        storyGroups={storyGroups}
        initialGroupIndex={selectedGroupIndex}
        currentUserId={userId}
        onClose={() => setViewerVisible(false)}
        onStoryDeleted={handleStoryDeleted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 4,
  },
  addStoryButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addStoryGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    gap: 16,
  },
  storyCard: {
    width: STORY_CARD_WIDTH,
    aspectRatio: 0.7,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 14,
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ownBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
  },
  ownBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  userInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storyTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  addButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
