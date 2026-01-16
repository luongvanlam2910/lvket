import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { photoService } from '../../services/storage/photoService';
import { authService } from '../../services/auth/authService';
import { Photo } from '../../types';

const { width } = Dimensions.get('window');

export default function StoriesScreen({ navigation }: any) {
  const [stories, setStories] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Refresh stories when screen comes into focus (e.g., returning from Camera)
  useFocusEffect(
    React.useCallback(() => {
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
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  const renderStoryItem = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => {
        // For now, just navigate to home - can implement story viewer later
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('Main', { screen: 'Home' });
        }
      }}
    >
      <Image
        source={{ uri: item.thumbnail_path || item.storage_path }}
        style={styles.storyImage}
        resizeMode="cover"
      />
      <View style={styles.storyOverlayGradient}>
        <View style={styles.storyOverlay}>
          <Text style={styles.storyTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Stories</Text>
          <Text style={styles.headerSubtitle}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} available
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addStoryButton}
          onPress={() => {
            // Navigate to Camera screen in parent Stack Navigator
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Camera', { storyMode: true });
            }
          }}
        >
          <Text style={styles.addStoryButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {stories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stories yet</Text>
          <Text style={styles.emptySubtext}>
            Stories from your friends will appear here
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Navigate to Camera screen in parent Stack Navigator
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Camera', { storyMode: true });
              }
            }}
          >
            <Text style={styles.addButtonText}>Create Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={renderStoryItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  addStoryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addStoryButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 26,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    marginBottom: 40,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listContent: {
    padding: 4,
  },
  storyItem: {
    flex: 1,
    margin: 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    aspectRatio: 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  storyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  storyTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

