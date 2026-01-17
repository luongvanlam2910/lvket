import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { photoService } from '../../services/storage/photoService';
import { authService } from '../../services/auth/authService';
import { friendService } from '../../services/storage/friendService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { User } from '../../types';

const MAX_VIDEO_DURATION = 15; // 15 seconds max

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const storyMode = (route.params as any)?.storyMode || false;
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [mediaMode, setMediaMode] = useState<'photo' | 'video'>('photo');
  const cameraRef = useRef<any>(null);
  const recordingProgressAnim = useRef(new Animated.Value(0)).current;
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh của bạn');
      }
    })();
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const friendsList = await friendService.getFriends(user.id);
        setFriends(friendsList);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.message}>Chúng tôi cần quyền sử dụng camera</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permissionButtonGradient}
            >
              <Text style={styles.permissionButtonText}>Cấp quyền</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setPhoto(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Lỗi', 'Không thể chụp ảnh');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        setRecordingProgress(0);
        recordingProgressAnim.setValue(0);

        // Animate progress
        Animated.timing(recordingProgressAnim, {
          toValue: 1,
          duration: MAX_VIDEO_DURATION * 1000,
          useNativeDriver: false,
        }).start();

        // Update progress text
        let elapsed = 0;
        recordingTimer.current = setInterval(() => {
          elapsed += 0.1;
          setRecordingProgress(Math.min(elapsed, MAX_VIDEO_DURATION));
          if (elapsed >= MAX_VIDEO_DURATION) {
            stopRecording();
          }
        }, 100);

        const videoResult = await cameraRef.current.recordAsync({
          maxDuration: MAX_VIDEO_DURATION,
          quality: '720p',
        });
        setVideo(videoResult.uri);
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Lỗi', 'Không thể quay video');
      } finally {
        setIsRecording(false);
        if (recordingTimer.current) {
          clearInterval(recordingTimer.current);
        }
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: storyMode ? ['images', 'videos'] : ['images'],
        allowsEditing: true,
        aspect: storyMode ? undefined : [1, 1],
        quality: 0.8,
        videoMaxDuration: storyMode ? MAX_VIDEO_DURATION : undefined,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        if (asset.type === 'video') {
          setVideo(asset.uri);
          setPhoto(null);
        } else {
          setPhoto(asset.uri);
          setVideo(null);
        }
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh/video');
    }
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const uploadMedia = async () => {
    const mediaUri = photo || video;
    if (!mediaUri) return;

    setUploading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập trước');
        navigation.goBack();
        return;
      }

      // Determine friend ID - if sendToAll, use null, otherwise use first selected friend
      const friendId = sendToAll ? undefined : selectedFriends[0] || undefined;

      await photoService.uploadPhoto({
        uri: mediaUri,
        userId: user.id,
        friendId,
        caption: caption.trim() || undefined,
        isStory: storyMode,
        isPhotoDump: false,
        type: video ? 'video' : 'photo',
        duration: video ? recordingProgress : undefined,
      });

      // Close screen immediately after successful upload
      navigation.goBack();
      
      // Show success message (non-blocking)
      setTimeout(() => {
        Alert.alert('Thành công', storyMode ? 'Đã đăng story!' : 'Đã tải lên!');
      }, 100);
    } catch (error: any) {
      console.error('Error uploading:', error);
      
      let errorMessage = error.message || 'Failed to upload';
      
      // Better error messages
      if (errorMessage.includes('Bucket not found')) {
        errorMessage = 'Storage buckets not set up. Please create "photos" and "thumbnails" buckets in Supabase Dashboard → Storage.';
      } else if (errorMessage.includes('not found') && errorMessage.includes('Storage')) {
        errorMessage = 'Storage not configured. Please set up storage buckets in Supabase.';
      } else if (errorMessage.includes('Permission denied') || errorMessage.includes('permission')) {
        errorMessage = 'Permission denied. Please check storage policies in Supabase.';
      }
      
      Alert.alert('Tải lên thất bại', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const retakeMedia = () => {
    setPhoto(null);
    setVideo(null);
    setCaption('');
    setSelectedFriends([]);
    setSendToAll(true);
    setRecordingProgress(0);
  };

  // Preview screen (after capture)
  if (photo || video) {
    return (
      <View style={styles.container}>
        {video ? (
          <Video
            source={{ uri: video }}
            style={styles.preview}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
          />
        ) : (
          <Image source={{ uri: photo! }} style={styles.preview} />
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.editGradient}
        >
          <View style={styles.editContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Thêm chú thích..."
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />

            {!storyMode && (
              <TouchableOpacity
                style={styles.friendsButton}
                onPress={() => setShowFriendsModal(true)}
              >
                <Text style={styles.friendsButtonText}>
                  {sendToAll
                    ? '👥 Gửi cho tất cả bạn bè'
                    : `👤 Gửi cho ${selectedFriends.length} bạn`}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakeMedia}
                disabled={uploading}
              >
                <Text style={styles.retakeButtonText}>Chụp lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.buttonDisabled]}
                onPress={uploadMedia}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadButtonGradient}
                  >
                    <Text style={styles.uploadButtonText}>
                      {storyMode ? '📖 Đăng Story' : '🚀 Tải lên'}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Friends Selection Modal */}
        <Modal
          visible={showFriendsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFriendsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn bạn bè</Text>
                <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.friendsList}>
                <TouchableOpacity
                  style={[
                    styles.friendOption,
                    sendToAll && styles.friendOptionSelected,
                  ]}
                  onPress={() => {
                    setSendToAll(true);
                    setSelectedFriends([]);
                  }}
                >
                  <Text
                    style={[
                      styles.friendOptionText,
                      sendToAll && styles.friendOptionTextSelected,
                    ]}
                  >
                    👥 Tất cả bạn bè
                  </Text>
                  {sendToAll && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendOption,
                      selectedFriends.includes(friend.id) &&
                        styles.friendOptionSelected,
                    ]}
                    onPress={() => {
                      setSendToAll(false);
                      toggleFriend(friend.id);
                    }}
                  >
                    <View style={styles.friendInfo}>
                      {friend.avatar_url ? (
                        <Image
                          source={{ uri: friend.avatar_url }}
                          style={styles.friendAvatar}
                        />
                      ) : (
                        <View style={styles.friendAvatarPlaceholder}>
                          <Text style={styles.friendAvatarText}>
                            {friend.username?.[0]?.toUpperCase() || friend.email[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.friendOptionText,
                          selectedFriends.includes(friend.id) &&
                            styles.friendOptionTextSelected,
                        ]}
                      >
                        {friend.username || friend.email}
                      </Text>
                    </View>
                    {selectedFriends.includes(friend.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={mediaMode}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.modeBadge}>
              {storyMode ? (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modeBadgeGradient}
                >
                  <Text style={styles.modeBadgeText}>📖 Story</Text>
                </LinearGradient>
              ) : (
                <View style={styles.modeBadgeNormal}>
                  <Text style={styles.modeBadgeText}>📷 Ảnh</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Recording progress */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {recordingProgress.toFixed(1)}s / {MAX_VIDEO_DURATION}s
              </Text>
              <Animated.View
                style={[
                  styles.recordingProgress,
                  {
                    width: recordingProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}

          {/* Mode switcher for story */}
          {storyMode && (
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mediaMode === 'photo' && styles.modeButtonActive,
                ]}
                onPress={() => setMediaMode('photo')}
              >
                <Text style={[
                  styles.modeButtonText,
                  mediaMode === 'photo' && styles.modeButtonTextActive,
                ]}>
                  📷 Ảnh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mediaMode === 'video' && styles.modeButtonActive,
                ]}
                onPress={() => setMediaMode('video')}
              >
                <Text style={[
                  styles.modeButtonText,
                  mediaMode === 'video' && styles.modeButtonTextActive,
                ]}>
                  🎥 Video
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImage}
            >
              <Text style={styles.galleryButtonText}>📷</Text>
              <Text style={styles.galleryLabel}>Thư viện</Text>
            </TouchableOpacity>
            
            {mediaMode === 'video' ? (
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isRecording && styles.captureButtonRecording,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <View style={[
                  styles.captureButtonInner,
                  isRecording && styles.captureButtonInnerRecording,
                ]} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            )}
            
            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 20,
  },
  permissionButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  modeBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  modeBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modeBadgeNormal: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginBottom: 8,
  },
  recordingTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recordingProgress: {
    height: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  modeSwitcher: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#000',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 50,
  },
  galleryButton: {
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 28,
    marginBottom: 4,
  },
  galleryLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
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
  captureButtonRecording: {
    borderColor: '#FF3B30',
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
  captureButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  editGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  editContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
    marginBottom: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  friendsButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  friendsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    flex: 1.5,
    borderRadius: 28,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  friendsList: {
    maxHeight: 400,
  },
  friendOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  friendOptionSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  friendOptionTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    color: '#667eea',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
