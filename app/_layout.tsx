import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Colors from '@/constants/colors';

import { ErrorBoundary } from "./error-boundary";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootLayoutNav />
        <StatusBar 
          style="light" 
          backgroundColor={Colors.dark.background}
          translucent={Platform.OS === 'android'}
        />
        <Toast />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check if the user is authenticated
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      // If they're not authenticated and not on an auth page, redirect them to the login page
      router.replace('/login');
    }
  }, [isAuthenticated, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/followers" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/following" options={{ presentation: 'card' }} />
      <Stack.Screen name="news/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="showcase/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="job/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="messages" options={{ presentation: 'card' }} />
      <Stack.Screen name="event/create" options={{ presentation: 'card' }} />
      <Stack.Screen name="event/ticket/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="showcase/create" options={{ presentation: 'card' }} />
    </Stack>
  );
}