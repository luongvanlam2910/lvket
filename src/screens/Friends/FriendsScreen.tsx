import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { friendService } from '../../services/storage/friendService';
import { authService } from '../../services/auth/authService';
import { User, Friendship } from '../../types';

export default function FriendsScreen({ navigation }: any) {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ friendship: Friendship; user: User }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  useEffect(() => {
    loadData();
  }, []);

  // Refresh friends when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      setUserId(user.id);
      const [friendsList, requests] = await Promise.all([
        friendService.getFriends(user.id),
        friendService.getPendingRequests(user.id),
      ]);
      setFriends(friendsList);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userId) return;

    setSearching(true);
    try {
      const results = await friendService.searchUsers(searchQuery, userId);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    if (!userId) return;

    try {
      await friendService.sendFriendRequest(userId, friendId);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn!');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lời mời kết bạn');
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    if (!userId) return;

    try {
      await friendService.acceptFriendRequest(friendshipId, userId);
      await loadData();
      Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chấp nhận yêu cầu');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!userId) return;

    Alert.alert(
      'Xóa bạn',
      'Bạn có chắc muốn xóa người bạn này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendService.removeFriend(userId, friendId);
              await loadData();
              Alert.alert('Thành công', 'Đã xóa bạn');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa bạn');
            }
          },
        },
      ]
    );
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.username?.[0]?.toUpperCase() || item.email[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username || item.email}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(item.id)}
      >
        <Text style={styles.removeButtonText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = ({ item }: { item: { friendship: Friendship; user: User } }) => (
    <View style={styles.friendItem}>
      <View style={styles.avatarContainer}>
        {item.user.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.user.username?.[0]?.toUpperCase() || item.user.email[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.user.username || item.user.email}</Text>
        <Text style={styles.friendEmail}>{item.user.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptRequest(item.friendship.id)}
      >
        <Text style={styles.acceptButtonText}>Chấp nhận</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchItem = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.username?.[0]?.toUpperCase() || item.email[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username || item.email}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Thêm</Text>
      </TouchableOpacity>
    </View>
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
        <Text style={styles.headerTitle}>Bạn bè</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo email hoặc tên người dùng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Tìm</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Bạn bè ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Yêu cầu ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        {searchResults.length > 0 && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
              Tìm kiếm ({searchResults.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có bạn bè</Text>
              <Text style={styles.emptySubtext}>
                Tìm kiếm người dùng để thêm bạn
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.friendship.id}
          renderItem={renderRequestItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
            </View>
          }
        />
      )}

      {activeTab === 'search' && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchItem}
        />
      )}
    </View>
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
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

