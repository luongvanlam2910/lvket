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
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { photoService } from '../../services/storage/photoService';
import { authService } from '../../services/auth/authService';
import { friendService } from '../../services/storage/friendService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { User } from '../../types';

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const storyMode = (route.params as any)?.storyMode || false;
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const cameraRef = useRef<any>(null);

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
        <Text style={styles.message}>Chúng tôi cần quyền sử dụng camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return;

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
        uri: photo,
        userId: user.id,
        friendId,
        caption: caption.trim() || undefined,
        isStory: storyMode,
        isPhotoDump: false,
      });

      // Close screen immediately after successful upload
      navigation.goBack();
      
      // Show success message (non-blocking)
      setTimeout(() => {
        Alert.alert('Thành công', storyMode ? 'Đã đăng story!' : 'Đã tải ảnh lên!');
      }, 100);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      let errorMessage = error.message || 'Failed to upload photo';
      
      // Better error messages
      if (errorMessage.includes('Bucket not found')) {
        errorMessage = 'Storage buckets not set up. Please create "photos" and "thumbnails" buckets in Supabase Dashboard → Storage. See QUICK_SETUP.md for instructions.';
      } else if (errorMessage.includes('not found') && errorMessage.includes('Storage')) {
        errorMessage = 'Storage not configured. Please set up storage buckets in Supabase.';
      } else if (errorMessage.includes('Permission denied') || errorMessage.includes('permission')) {
        errorMessage = 'Permission denied. Please check storage policies in Supabase.';
      } else if (errorMessage.includes('Please login')) {
        errorMessage = 'Please login first before uploading photos.';
      }
      
      Alert.alert('Tải lên thất bại', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setCaption('');
    setSelectedFriends([]);
    setSendToAll(true);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        
        <View style={styles.editContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Thêm chú thích..."
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
            placeholderTextColor="#999"
          />

          {!storyMode && (
            <>
              <TouchableOpacity
                style={styles.friendsButton}
                onPress={() => setShowFriendsModal(true)}
              >
                <Text style={styles.friendsButtonText}>
                  {sendToAll
                    ? 'Gửi cho tất cả bạn bè'
                    : `Gửi cho ${selectedFriends.length} bạn`}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={retakePhoto}
              disabled={uploading}
            >
              <Text style={styles.buttonText}>Chụp lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
              onPress={uploadPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {storyMode ? 'Đăng Story' : 'Tải lên'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

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
                    Tất cả bạn bè
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
                    <Text
                      style={[
                        styles.friendOptionText,
                        selectedFriends.includes(friend.id) &&
                          styles.friendOptionTextSelected,
                      ]}
                    >
                      {friend.username || friend.email}
                    </Text>
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

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {storyMode && (
              <View style={styles.storyBadge}>
                <Text style={styles.storyBadgeText}>📖 Story</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImage}
            >
              <Text style={styles.galleryButtonText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  storyBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  storyBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 24,
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
  placeholder: {
    width: 50,
    height: 50,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  editContainer: {
    backgroundColor: '#000',
    padding: 20,
  },
  captionInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  friendsButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  friendsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#666',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  friendOptionSelected: {
    backgroundColor: '#2a2a2a',
  },
  friendOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  friendOptionTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
