import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_700Bold, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '@/services/background-location';

import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: 'index',
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
        <Stack.Screen name="index" options={{ animation: 'none' }} />

        {/* Landing — first launch only (before first sign-up / sign-in) */}
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
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
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
