import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { photoService } from '../../services/storage/photoService';
import { Photo, User } from '../../types';
import { authService } from '../../services/auth/authService';
import { notificationService } from '../../services/notifications/notificationService';
import { friendService } from '../../services/storage/friendService';
import { supabase } from '../../services/api/supabase';
import PhotoCard from '../../components/Photo/PhotoCard';
import PhotoFeedItem from '../../components/Photo/PhotoFeedItem';
import PhotoDetail from '../../components/Photo/PhotoDetail';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.65; // 65% of screen height

export default function HomeScreen({ navigation }: any) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewMode, setViewMode] = useState<'camera' | 'grid'>('camera');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedView, setSelectedView] = useState<'all' | string>('all');
  const [user, setUser] = useState<User | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoOwners, setPhotoOwners] = useState<Record<string, User>>({});
  const cameraRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadPhotos, 30000);
    const notificationInterval = setInterval(loadUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
      loadUnreadCount();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([
      loadUser(),
      loadFriends(),
      loadPhotos(),
      loadUnreadCount(),
    ]);
  };

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (data) {
          setUser(data as User);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const friendsList = await friendService.getFriends(currentUser.id);
        setFriends(friendsList);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const count = await notificationService.getUnreadCount(currentUser.id);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigation.replace('Login');
        return;
      }

      setUserId(currentUser.id);
      const userPhotos = await photoService.getPhotos(currentUser.id);
      setPhotos(userPhotos);

      // Load photo owners
      const userIds = [...new Set(userPhotos.map(p => p.user_id))];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (usersData) {
          const ownersMap: Record<string, User> = {};
          usersData.forEach(u => {
            ownersMap[u.id] = u as User;
          });
          setPhotoOwners(ownersMap);
        }
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && cameraPermission?.granted) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        // Navigate to camera screen with the photo
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('Camera', { initialPhoto: photo.uri });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    } else {
      // If no permission, just navigate to camera screen
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Camera');
      }
    }
  };

  const keyExtractor = useCallback((item: Photo) => item.id, []);
  
  const renderFeedItem = useCallback(({ item }: { item: Photo }) => {
    const owner = photoOwners[item.user_id];
    if (!owner || !userId) return null;

    return (
      <PhotoFeedItem
        photo={item}
        photoOwner={owner}
        currentUserId={userId}
        onPress={() => setSelectedPhoto(item)}
      />
    );
  }, [photoOwners, userId]);

  const renderGridItem = useCallback(({ item }: { item: Photo }) => (
    <PhotoCard
      photo={item}
      onPress={() => setSelectedPhoto(item)}
    />
  ), []);

  const getViewLabel = () => {
    if (selectedView === 'all') {
      return `Mọi người${friends.length > 0 ? ` (${friends.length + 1})` : ''}`;
    }
    const friend = friends.find(f => f.id === selectedView);
    return friend?.username || friend?.email || 'Mọi người';
  };

  const latestPhoto = photos.length > 0 ? photos[0] : null;
  const latestPhotoOwner = latestPhoto ? photoOwners[latestPhoto.user_id] : null;
  const feedPhotos = photos.slice(1); // All photos except the first one

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Settings');
            }
          }}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.username?.[0]?.toUpperCase() || user?.email[0].toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* View Selector */}
        <TouchableOpacity
          style={styles.viewSelector}
          onPress={() => {
            // Toggle between 'all' and friends
            // For now, just show all
          }}
        >
          <Text style={styles.viewSelectorText}>{getViewLabel()}</Text>
          <Text style={styles.viewSelectorIcon}>▼</Text>
        </TouchableOpacity>

        {/* Messages Icon */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            navigation.navigate('Messages');
          }}
        >
          <Text style={styles.headerButtonIcon}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {viewMode === 'camera' ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Camera Preview Section */}
          <View style={styles.cameraPreviewContainer}>
            {cameraPermission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={styles.cameraPreview}
                facing={facing}
              >
                <View style={styles.cameraOverlay}>
                  <TouchableOpacity
                    style={styles.flipButton}
                    onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                  >
                    <Text style={styles.flipButtonText}>🔄</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            ) : (
              <View style={styles.cameraPreviewPlaceholder}>
                <Text style={styles.cameraPlaceholderIcon}>📷</Text>
                <Text style={styles.cameraPlaceholderText}>
                  Cho phép truy cập camera để chụp ảnh
                </Text>
                <TouchableOpacity
                  style={styles.requestPermissionButton}
                  onPress={requestCameraPermission}
                >
                  <Text style={styles.requestPermissionText}>Cấp quyền</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Latest Photo Feed Item */}
          {latestPhoto && latestPhotoOwner && userId && (
            <PhotoFeedItem
              photo={latestPhoto}
              photoOwner={latestPhotoOwner}
              currentUserId={userId}
              onPress={() => setSelectedPhoto(latestPhoto)}
            />
          )}

          {/* History Section */}
          {feedPhotos.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Lịch sử</Text>
              {feedPhotos.map((photo) => {
                const owner = photoOwners[photo.user_id];
                if (!owner || !userId) return null;
                return (
                  <PhotoFeedItem
                    key={photo.id}
                    photo={photo}
                    photoOwner={owner}
                    currentUserId={userId}
                    onPress={() => setSelectedPhoto(photo)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={keyExtractor}
          renderItem={renderGridItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadPhotos}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={5}
          initialNumToRender={10}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {/* Grid/List Toggle */}
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => setViewMode(viewMode === 'camera' ? 'grid' : 'camera')}
        >
          <Text style={styles.bottomButtonIcon}>
            {viewMode === 'camera' ? '⊞' : '📷'}
          </Text>
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        {/* Share/Upload Button */}
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Camera');
            }
          }}
        >
          <Text style={styles.bottomButtonIcon}>⬆️</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Modal
          visible={!!selectedPhoto}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <PhotoDetail
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onDelete={() => {
              setPhotos(photos.filter((p) => p.id !== selectedPhoto.id));
              setSelectedPhoto(null);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewSelectorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewSelectorIcon: {
    color: '#fff',
    fontSize: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonIcon: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  cameraPreviewContainer: {
    width: SCREEN_WIDTH,
    height: CAMERA_PREVIEW_HEIGHT,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 22,
  },
  cameraPreviewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraPlaceholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  cameraPlaceholderText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  requestPermissionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  requestPermissionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: '#000',
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonIcon: {
    fontSize: 28,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
});
