import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ensureMapboxConfigured } from '@/utils/mapbox-init';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
ensureMapboxConfigured();

export const unstable_settings = {
  anchor: '(landing)',
};

/**
 * Inner layout that reads the theme from AppThemeProvider.
 * Must be a child of AppThemeProvider so the hook works.
 */
function InnerRootLayout() {
  const { isDark, colors } = useAppTheme();

  // Build a React Navigation theme from our palette
  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.navBackground,
          card: colors.navCard,
          text: colors.navText,
          border: colors.navBorder,
          primary: colors.navPrimary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.navBackground,
          card: colors.navCard,
          text: colors.navText,
          border: colors.navBorder,
          primary: colors.navPrimary,
        },
      };

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
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

        {/* Emergency Screens */}
        <Stack.Screen 
          name="emergency/EmergencyContactsDetails"
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="emergency/EmergencyForm"
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />

        {/* Modal */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colors.statusBarStyle} />
    </ThemeProvider>
  );
}

function FontBootstrap({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <FontBootstrap>
      <AppThemeProvider>
        <AuthProvider>
          <InnerRootLayout />
        </AuthProvider>
      </AppThemeProvider>
    </FontBootstrap>
  );
}
