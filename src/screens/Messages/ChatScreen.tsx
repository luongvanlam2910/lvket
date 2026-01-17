import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { messageService } from '../../services/storage/messageService';
import { authService } from '../../services/auth/authService';
import { supabase } from '../../services/api/supabase';
import { Message, User, Photo } from '../../types';

// Memoized MessageBubble component for better performance
const MessageBubble = memo(({ 
  item, 
  isMyMessage, 
  isRead, 
  formatTime 
}: { 
  item: Message; 
  isMyMessage: boolean; 
  isRead: boolean;
  formatTime: (date: string) => string;
}) => (
  <View
    style={[
      styles.messageContainer,
      isMyMessage ? styles.myMessage : styles.friendMessage,
    ]}
  >
    <View
      style={[
        styles.messageBubble,
        isMyMessage ? styles.myBubble : styles.friendBubble,
        item.type === 'photo' && styles.photoBubble,
      ]}
    >
      {item.type === 'photo' && item.media_url ? (
        <Image
          source={{ uri: item.media_url }}
          style={styles.messageImage}
          resizeMode="cover"
        />
      ) : null}
      {item.content && (
        <Text
          style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.friendMessageText,
            item.type === 'photo' && styles.photoMessageText,
          ]}
        >
          {item.content}
        </Text>
      )}
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.friendMessageTime,
          ]}
        >
          {formatTime(item.created_at)}
        </Text>
      </View>
    </View>
    {isMyMessage && (
      <View style={styles.readReceiptContainer}>
        <Text style={styles.readReceipt}>
          {isRead ? 'đã xem' : 'đã nhận'}
        </Text>
      </View>
    )}
  </View>
));

export default function ChatScreen({ route, navigation }: any) {
  const { friend, replyPhoto }: { friend: User; replyPhoto?: Photo } = route.params || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [replyPhotoUrl, setReplyPhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (replyPhoto?.storage_path) {
      setReplyPhotoUrl(replyPhoto.storage_path);
    }
  }, [replyPhoto]);
  const flatListRef = useRef<FlatList>(null);
  const realtimeSubscription = useRef<{ unsubscribe: () => void } | null>(
    null
  );
  const typingSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const readReceiptsSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const typingShowTimeout = useRef<NodeJS.Timeout | null>(null);
  const friendTypingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Common emojis
  const commonEmojis = ['❤️', '😊', '😂', '😍', '😭', '😮', '👍', '👎', '🔥', '💯', '🎉', '🙏', '😎', '🤔', '😴', '😋', '🥳', '😇', '🤗', '😘'];

  useEffect(() => {
    loadData();
    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
      if (typingSubscription.current) {
        typingSubscription.current.unsubscribe();
      }
      if (readReceiptsSubscription.current) {
        readReceiptsSubscription.current.unsubscribe();
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      if (typingShowTimeout.current) {
        clearTimeout(typingShowTimeout.current);
      }
      if (friendTypingTimeout.current) {
        clearTimeout(friendTypingTimeout.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        loadMessages();
        markAsRead();
      }
    }, [currentUserId])
  );

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      setCurrentUserId(user.id);
      await loadMessages();
      markAsRead();

      // Setup realtime listener
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }

      realtimeSubscription.current = messageService.setupRealtimeListener(
        user.id,
        friend.id,
        (newMessage) => {
          console.log('New message in realtime:', newMessage);
          setMessages((prev) => {
            // Check if message already exists
            if (prev.find((m) => m.id === newMessage.id)) {
              console.log('Message already exists, skipping');
              return prev;
            }
            console.log('Adding new message to list');
            return [...prev, newMessage];
          });
          if (newMessage.receiver_id === user.id) {
            markAsRead();
          }
          setTimeout(() => scrollToBottom(), 100);
        }
      );

      // Setup typing indicator listener
      typingSubscription.current = messageService.setupTypingListener(
        user.id,
        friend.id,
        (isTyping) => {
          if (isTyping) {
            // Clear existing timeout
            if (friendTypingTimeout.current) {
              clearTimeout(friendTypingTimeout.current);
            }
            // Show typing indicator after 1.5 seconds delay
            typingShowTimeout.current = setTimeout(() => {
              setIsFriendTyping(true);
            }, 1500);
          } else {
            // Clear show timeout if user stopped typing before showing
            if (typingShowTimeout.current) {
              clearTimeout(typingShowTimeout.current);
            }
            // Hide typing indicator after 2 seconds delay
            friendTypingTimeout.current = setTimeout(() => {
              setIsFriendTyping(false);
            }, 2000);
          }
        }
      );

      // Setup read receipts listener
      readReceiptsSubscription.current = messageService.setupReadReceiptsListener(
        user.id,
        friend.id,
        (messageId) => {
          setReadMessageIds((prev) => new Set([...prev, messageId]));
        }
      );
    } catch (error: any) {
      console.error('Error loading chat data:', error);
      Alert.alert('Lỗi', 'Không thể tải cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentUserId) return;
    try {
      const data = await messageService.getMessages(
        currentUserId,
        friend.id,
        100
      );
      setMessages(data);
      setTimeout(() => scrollToBottom(), 200);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async () => {
    if (!currentUserId) return;
    try {
      await messageService.markAsRead(currentUserId, friend.id);
      // Update read status for messages in state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === friend.id && msg.receiver_id === currentUserId
            ? { ...msg, read: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Check if message is read
  const isMessageRead = (message: Message): boolean => {
    return readMessageIds.has(message.id) || message.read === true;
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!currentUserId) return;

    // Clear existing timeouts
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Send typing indicator after 1.5 seconds delay (not immediately)
    typingTimeout.current = setTimeout(() => {
      messageService.sendTypingIndicator(currentUserId, friend.id, true);
      
      // Stop typing after 3 seconds of no input (after showing)
      typingTimeout.current = setTimeout(() => {
        messageService.sendTypingIndicator(currentUserId, friend.id, false);
      }, 3000);
    }, 1500);
  };

  const sendMessage = async (content?: string, imageUrl?: string) => {
    const text = content || messageText.trim();
    const photoToSend = imageUrl || replyPhotoUrl;
    if (!text && !photoToSend || !currentUserId || sending || uploadingImage) return;

    setMessageText('');
    setReplyPhotoUrl(null); // Clear reply photo after sending
    setSending(true);

    try {
      // Stop typing indicator
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      if (currentUserId) {
        messageService.sendTypingIndicator(currentUserId, friend.id, false);
      }

      const newMessage = await messageService.sendMessage(
        currentUserId,
        friend.id,
        text || (photoToSend ? '📷 Photo' : ''),
        photoToSend ? 'photo' : 'text',
        photoToSend
      );
      console.log('Message sent successfully:', newMessage);
      // Add message immediately to show it right away
      setMessages((prev) => {
        // Check if already exists (from realtime)
        if (prev.find((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
      if (!imageUrl) {
        setMessageText(text); // Restore message text on error
      }
    } finally {
      setSending(false);
    }
  };

  const pickAndSendImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);
      const imageUri = result.assets[0].uri;

      // Upload image to Supabase Storage
      const user = await authService.getCurrentUser();
      if (!user) return;

      const timestamp = Date.now();
      const fileName = `messages/${user.id}/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;

      // Convert to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Send message with image
      await sendMessage('', urlData.publicUrl);
    } catch (error: any) {
      console.error('Error sending image:', error);
      Alert.alert('Lỗi', 'Không thể gửi ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Memoized render function for FlatList
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === currentUserId;
    const isRead = isMessageRead(item);

    return (
      <MessageBubble
        item={item}
        isMyMessage={isMyMessage}
        isRead={isRead}
        formatTime={formatTime}
      />
    );
  }, [currentUserId, readMessageIds]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Memoized getItemLayout for better scroll performance
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 80, // Approximate item height
    offset: 80 * index,
    index,
  }), []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {friend.avatar_url ? (
            <Image source={{ uri: friend.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {friend.username?.[0]?.toUpperCase() ||
                  friend.email[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerName}>
            {friend.username || friend.email}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        inverted={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
        ListFooterComponent={
          isFriendTyping ? (
            <View style={styles.typingIndicator}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
              <Text style={styles.typingText}>đang nhập...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputContainer}>
        {replyPhotoUrl && (
          <View style={styles.replyPhotoPreview}>
            <Image
              source={{ uri: replyPhotoUrl }}
              style={styles.replyPhotoImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeReplyPhotoButton}
              onPress={() => setReplyPhotoUrl(null)}
            >
              <Text style={styles.removeReplyPhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickAndSendImage}
            disabled={sending || uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.attachButtonText}>📷</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Text style={styles.emojiButtonText}>😊</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={handleTyping}
            placeholder={replyPhotoUrl ? "Thêm chú thích..." : "Nhập tin nhắn..."}
            multiline
            maxLength={1000}
            onSubmitEditing={() => {
              if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
              }
              if (currentUserId) {
                messageService.sendTypingIndicator(currentUserId, friend.id, false).catch(console.error);
              }
              sendMessage();
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              ((!messageText.trim() && !replyPhotoUrl) || sending || uploadingImage) && styles.sendButtonDisabled
            ]}
            onPress={() => sendMessage()}
            disabled={(!messageText.trim() && !replyPhotoUrl) || sending || uploadingImage}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={styles.emojiModalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiModalContent}>
            <View style={styles.emojiModalHeader}>
              <Text style={styles.emojiModalTitle}>Chọn Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Text style={styles.emojiModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.emojiGrid}>
              {commonEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiItem}
                  onPress={() => insertEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  friendMessage: {
    alignItems: 'flex-start',
  },
  messageWrapper: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: '#000',
    borderBottomRightRadius: 4,
  },
  friendBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  friendMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  friendMessageTime: {
    color: '#999',
  },
  readReceiptContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 12,
    marginBottom: 2,
  },
  readReceipt: {
    fontSize: 11,
    color: '#666',
    fontWeight: '400',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 15,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  typingDotDelay1: {
    animationDelay: '0.2s',
  },
  typingDotDelay2: {
    animationDelay: '0.4s',
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  replyPhotoPreview: {
    position: 'relative',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 8,
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  replyPhotoImage: {
    width: '100%',
    height: '100%',
  },
  removeReplyPhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeReplyPhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 24,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  photoBubble: {
    padding: 0,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  photoMessageText: {
    marginTop: 8,
  },
  emojiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  emojiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emojiModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emojiModalClose: {
    fontSize: 24,
    color: '#999',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
  },
  emojiItem: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  emojiText: {
    fontSize: 32,
  },
});

