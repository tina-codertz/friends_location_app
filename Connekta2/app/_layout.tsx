import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/context/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return(
    <AuthProvider>
    <RootLayoutNav />
    </AuthProvider>

  )
  
   
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="index" options={{animation:"none"}} />
        <Stack.Screen name="(landing)" />
        <Stack.Screen name="auth/AuthScreen" options={{animation:"slide_from_right"}} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="emergency/EmergencyContactsDetails" options={{presentation:"modal", animation:"slide_from_bottom"}} />
        <Stack.Screen name="emergency/EmergencyForm" options={{presentation:"modal", animation:"slide_from_bottom"}} />
      </Stack>
    </ThemeProvider>
  );
}
