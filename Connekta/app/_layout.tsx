import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

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

        {/* Modal */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colors.statusBarStyle} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <InnerRootLayout />
      </AuthProvider>
    </AppThemeProvider>
  );
}
