import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { photoService } from '../../services/storage/photoService';
import { Photo } from '../../types';
import { authService } from '../../services/auth/authService';
import { notificationService } from '../../services/notifications/notificationService';
import PhotoCard from '../../components/Photo/PhotoCard';
import PhotoDetail from '../../components/Photo/PhotoDetail';

export default function HomeScreen({ navigation }: any) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const swipeX = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');
  const isSwiping = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only activate if horizontal movement is significantly greater than vertical
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
        const isSignificant = Math.abs(gestureState.dx) > 15;
        if (isHorizontal && isSignificant) {
          console.log('Pan responder activated:', { dx: gestureState.dx, dy: gestureState.dy });
        }
        return isHorizontal && isSignificant;
      },
      onPanResponderGrant: () => {
        isSwiping.current = true;
        swipeX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isSwiping.current) {
          // Update animation value as user swipes - limit to screen width
          const clampedDx = Math.max(-screenWidth, Math.min(screenWidth, gestureState.dx));
          swipeX.setValue(clampedDx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        isSwiping.current = false;
        const swipeThreshold = 50; // Lower threshold for easier swiping
        console.log('Pan responder released:', { dx: gestureState.dx, threshold: swipeThreshold });
        
        // Swipe right (positive dx) to open Camera
        if (gestureState.dx > swipeThreshold) {
          Animated.timing(swipeX, {
            toValue: screenWidth,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            swipeX.setValue(0);
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Camera');
            }
          });
        }
        // Swipe left (negative dx) to open Messages
        else if (gestureState.dx < -swipeThreshold) {
          console.log('Swipe left detected, navigating to Messages');
          Animated.timing(swipeX, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            swipeX.setValue(0);
            try {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Messages');
                console.log('Navigation to Messages successful');
              }
            } catch (error) {
              console.error('Error navigating to Messages:', error);
            }
          });
        } else {
          // Reset if swipe is too small - smooth spring animation
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
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

  useEffect(() => {
    loadPhotos();
    loadUnreadCount();
    const interval = setInterval(loadPhotos, 30000); // Refresh every 30 seconds
    const notificationInterval = setInterval(loadUnreadCount, 30000); // Refresh notifications every 30 seconds
    return () => {
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, []);

  // Refresh photos when screen comes into focus (e.g., returning from Camera)
  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
      loadUnreadCount();
    }, [])
  );

  const loadUnreadCount = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      setUserId(user.id);
      const userPhotos = await photoService.getPhotos(user.id);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const translateX = swipeX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: [-screenWidth, 0, screenWidth],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.contentWrapper,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Navigate to Camera screen in parent Stack Navigator
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Camera');
            }
          }}
        >
          <Text style={styles.headerButtonIcon}>📷</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LVket</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Navigate to Notifications screen in parent Stack Navigator
            console.log('Notifications button pressed');
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Notifications');
              console.log('Navigation to Notifications successful');
            }
          }}
        >
          <View style={styles.notificationButtonContainer}>
            <Text style={styles.headerButtonIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
          <Text style={styles.emptySubtext}>
            Chia sẻ ảnh với bạn bè thân của bạn!
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Navigate to Camera screen in parent Stack Navigator
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Camera');
              }
            }}
          >
            <Text style={styles.addButtonText}>Chụp ảnh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={useCallback((item: Photo) => item.id, [])}
          renderItem={useCallback(({ item }: { item: Photo }) => (
            <PhotoCard
              photo={item}
              onPress={() => setSelectedPhoto(item)}
            />
          ), [])}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadPhotos}
          scrollEnabled={!isSwiping.current}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={5}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      )}

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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerButtonIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
  notificationButtonContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3040',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  cameraButton: {
    fontSize: 32,
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
});

