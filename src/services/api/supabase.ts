import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gjluacrkryivkjezsokt.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9u84HOw8e3rH-3rTo478nQ_RRzXg19T';

// Custom storage for Supabase - use localStorage on web, SecureStore on native
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      return localStorage.getItem(key);
    } else {
      // Use SecureStore on native
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('SecureStore getItem error:', error);
        return null;
      }
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      localStorage.setItem(key, value);
    } else {
      // Use SecureStore on native
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('SecureStore setItem error:', error);
      }
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      localStorage.removeItem(key);
    } else {
      // Use SecureStore on native
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('SecureStore removeItem error:', error);
      }
    }
  },
};

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

