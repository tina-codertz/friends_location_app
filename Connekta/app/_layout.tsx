import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(landing)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        {/* Landing Page */}
        <Stack.Screen name="(landing)" />

        {/* Auth Screens */}
        <Stack.Screen
          name="auth/AuthScreen"
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Main App Tabs */}
        <Stack.Screen name="(tabs)" />

        {/* Modal */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
