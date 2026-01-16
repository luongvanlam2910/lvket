import { supabase } from '../api/supabase';
import { WidgetSettings, Photo } from '../../types';
import { photoService } from './photoService';
import { authService } from '../auth/authService';

export const widgetService = {
  // Get or create widget settings
  getWidgetSettings: async (userId: string): Promise<WidgetSettings> => {
    const { data, error } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Settings don't exist, create default
      const defaultSettings: Omit<WidgetSettings, 'updated_at'> = {
        user_id: userId,
        theme: 'light',
        layout: 'grid',
        max_photos: 10,
        show_stories: true,
      };

      const { data: newData, error: insertError } = await supabase
        .from('widget_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) throw insertError;
      return { ...newData, updated_at: new Date().toISOString() } as WidgetSettings;
    }

    if (error) throw error;
    return data as WidgetSettings;
  },

  // Update widget settings
  updateWidgetSettings: async (
    userId: string,
    updates: Partial<Omit<WidgetSettings, 'user_id' | 'updated_at'>>
  ): Promise<WidgetSettings> => {
    const { data, error } = await supabase
      .from('widget_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as WidgetSettings;
  },

  // Get photos for widget
  getWidgetPhotos: async (userId: string, limit: number = 10): Promise<Photo[]> => {
    try {
      const photos = await photoService.getPhotos(userId, limit);
      return photos;
    } catch (error) {
      console.error('Error getting widget photos:', error);
      return [];
    }
  },

  // Get stories for widget
  getWidgetStories: async (userId: string): Promise<Photo[]> => {
    try {
      const stories = await photoService.getStories(userId);
      return stories.slice(0, 5); // Limit to 5 stories for widget
    } catch (error) {
      console.error('Error getting widget stories:', error);
      return [];
    }
  },
};

