import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authService } from './src/services/auth/authService';
import { notificationService } from './src/services/notifications/notificationService';
import LoginScreen from './src/screens/Auth/LoginScreen';
import SignUpScreen from './src/screens/Auth/SignUpScreen';
import MainNavigator from './src/navigation/MainNavigator';
import CameraScreen from './src/screens/Camera/CameraScreen';
import EditProfileScreen from './src/screens/Settings/EditProfileScreen';
import PrivacyScreen from './src/screens/Settings/PrivacyScreen';
import NotificationSettingsScreen from './src/screens/Settings/NotificationSettingsScreen';
import TermsOfServiceScreen from './src/screens/Settings/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/Settings/PrivacyPolicyScreen';
import ChatScreen from './src/screens/Messages/ChatScreen';
import MessagesScreen from './src/screens/Messages/MessagesScreen';
import NotificationsScreen from './src/screens/Notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((session) => {
      console.log('Auth state changed:', !!session);
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Setup notifications realtime listener when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let notificationSubscription: { unsubscribe: () => void } | null = null;

    const setupNotificationListener = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        // Setup Realtime listener for notifications
        notificationSubscription = notificationService.setupRealtimeListener(
          user.id,
          async (notification) => {
            // Notification received - you can show a local notification here
            console.log('New notification received:', notification);
            
            // Send local notification
            await notificationService.sendLocalNotificationForAppNotification(notification);
          }
        );
      } catch (error) {
        console.error('Error setting up notification listener:', error);
      }
    };

    setupNotificationListener();

    return () => {
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
      }
    };
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const session = await authService.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ headerShown: false }}
          key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main" component={MainNavigator} />
              <Stack.Screen 
                name="Camera" 
                component={CameraScreen}
                options={{ presentation: 'fullScreenModal' }}
              />
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="Privacy" 
                component={PrivacyScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="NotificationSettings" 
                component={NotificationSettingsScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="TermsOfService" 
                component={TermsOfServiceScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="PrivacyPolicy" 
                component={PrivacyPolicyScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="Chat" 
                component={ChatScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="Messages" 
                component={MessagesScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
                options={{ presentation: 'card', headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
