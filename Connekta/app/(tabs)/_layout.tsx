import { Tabs } from 'expo-router';
import React from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppOpenLocationPing } from '@/components/location/AppOpenLocationPing';
import { ConnektaTabBar } from '@/components/navigation/ConnektaTabBar';
import { BiometricGate } from '@/components/security/BiometricGate';
import { SessionTimeoutGuard } from '@/components/security/SessionTimeoutGuard';

export const unstable_settings = {
  initialRouteName: 'map',
};

export default function TabLayout() {
  return (
    <AuthGuard>
      <AppOpenLocationPing />
      <SessionTimeoutGuard>
      <BiometricGate>
      <Tabs
        tabBar={(props) => <ConnektaTabBar {...props} />}
        screenOptions={{
          lazy: true,
          headerShown: false,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen name="map" options={{ title: 'Map' }} />
        <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
        <Tabs.Screen name="emergency" options={{ title: 'Safety' }} />
        <Tabs.Screen name="settings" options={{ title: 'Profile' }} />
        {/* Hidden screens, accessed from hamburger menu */}
        <Tabs.Screen name="MyPlaces" options={{ href: null }} />
        <Tabs.Screen name="SOSScreen" options={{ href: null }} />
        <Tabs.Screen name="ShareLocation" options={{ href: null }} />
      </Tabs>
      </BiometricGate>
      </SessionTimeoutGuard>
    </AuthGuard>
  );
}
