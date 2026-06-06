import { AuthGuard } from '@/components/auth/AuthGuard';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,

        }}>
        <Tabs.Screen name="map" options={{ title: "Map" }} />
        <Tabs.Screen name="friends" options={{ title: "Friends" }} />
        <Tabs.Screen name="emergency" options={{ title: "Safety" }} />
        <Tabs.Screen name="settings" options={{ title: "Profile" }} />
        {/* hidden */}
        <Tabs.Screen name="MyPlaces" options={{ href: null }} />
        <Tabs.Screen name="SOSScreen" options={{ href: null }} />
        <Tabs.Screen name="ShareLocation" options={{ href: null }} />
      </Tabs>
    </AuthGuard>
  )
}