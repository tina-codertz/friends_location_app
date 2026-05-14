import { Tabs } from 'expo-router';
import React from 'react';

import { BiometricGate } from '@/components/security/BiometricGate';
import { HapticTab } from '@/components/ui/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  initialRouteName: 'map',
};

const TabBarButton = (props: any) => <HapticTab {...props} />;

export default function TabLayout() {
  const { colors, accent } = useAppTheme();

  return (
    <BiometricGate>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: accent.electricBlue,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.navCard,
            borderTopColor: colors.divider,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
          headerShown: false,
          tabBarButton: TabBarButton,
        }}>
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Friends',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="emergency"
          options={{
            title: 'Emergency',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="cross.case.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
          }}
        />
      </Tabs>
    </BiometricGate>
  );
}
