import { Stack } from 'expo-router';
import React from 'react';
import { useAppTheme } from '@/context/ThemeContext';

export default function SettingsStackLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.navCard },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings', headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="CircleManagement" options={{ title: 'Circle Management' }} />
      <Stack.Screen name="LocationHistory" options={{ title: 'Location History' }} />
    </Stack>
  );
}
