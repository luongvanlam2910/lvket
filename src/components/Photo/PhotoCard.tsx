import React, { memo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Photo } from '../../types';

interface PhotoCardProps {
  photo: Photo;
  onPress: () => void;
}

// Memoized PhotoCard for better list performance
const PhotoCard = memo(function PhotoCard({ photo, onPress }: PhotoCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      <Image
        source={{ 
          uri: photo.thumbnail_path || photo.storage_path,
        }}
        style={[styles.image, error && styles.errorImage]}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradientOverlay}
      />
      {photo.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption} numberOfLines={2}>
            {photo.caption}
          </Text>
        </View>
      )}
      {photo.is_story && (
        <View style={styles.storyBadge}>
          <Text style={styles.storyBadgeText}>📖</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  storyBadgeText: {
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    zIndex: 1,
  },
  errorImage: {
    opacity: 0.5,
  },
});

export default PhotoCard;

