import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BiometricGate } from '@/components/security/BiometricGate';
import { HapticTab } from '@/components/ui/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  initialRouteName: 'map',
};

const TabBarButton = (props: any) => <HapticTab {...props} />;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();

  return (
    <BiometricGate>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: accent.electricBlue,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.navCard,
            borderTopColor: colors.navBorder,
            borderTopWidth: 1,
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom + 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginTop: 4 },
          headerShown: false,
          tabBarButton: TabBarButton,
        }}>
        <Tabs.Screen
          name="map"
          options={{
            title: 'Location',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'My Circle',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="emergency"
          options={{
            title: 'Safety',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="cross.case.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
          }}
        />
        {/* Hidden screens, accessed from hamburger menu */}
        <Tabs.Screen name="MyPlaces" options={{ href: null }} />
        <Tabs.Screen name="SOSScreen" options={{ href: null }} />
        <Tabs.Screen name="ShareLocation" options={{ href: null }} />
      </Tabs>
    </BiometricGate>
  );
}
