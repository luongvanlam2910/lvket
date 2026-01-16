import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth/authService';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const [whoCanSeePhotos, setWhoCanSeePhotos] = useState<'friends' | 'all'>('friends');
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Note: These settings would typically be stored in database
  // For now, we'll just show the UI

  const handleSave = () => {
    // TODO: Save privacy settings to database
    Alert.alert('Success', 'Privacy settings saved');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who can see your photos</Text>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setWhoCanSeePhotos('friends')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Friends only</Text>
              <Text style={styles.optionDescription}>
                Only your friends can see your photos
              </Text>
            </View>
            <View style={[styles.radio, whoCanSeePhotos === 'friends' && styles.radioSelected]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setWhoCanSeePhotos('all')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Everyone</Text>
              <Text style={styles.optionDescription}>
                All users can see your photos
              </Text>
            </View>
            <View style={[styles.radio, whoCanSeePhotos === 'all' && styles.radioSelected]} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend requests</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow friend requests</Text>
              <Text style={styles.settingDescription}>
                Let others send you friend requests
              </Text>
            </View>
            <Switch
              value={allowFriendRequests}
              onValueChange={setAllowFriendRequests}
              trackColor={{ false: '#ddd', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show online status</Text>
              <Text style={styles.settingDescription}>
                Let friends see when you're online
              </Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: '#ddd', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  radioSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

