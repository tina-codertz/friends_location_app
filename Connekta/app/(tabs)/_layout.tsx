import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/ui/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/context/ThemeContext';

const TabBarButton = (props: any) => <HapticTab {...props} />;

export default function TabLayout() {
  const { colors, accent, isDark } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? accent.teal : accent.tealDark,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.divider,
        },
        headerShown: false,
        tabBarButton: TabBarButton,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
