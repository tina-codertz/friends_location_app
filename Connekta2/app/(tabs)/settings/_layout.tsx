import { Stack } from 'expo-router'

export default function SettingsStackLayout() {
    return (
        <Stack
        screenOptions={{
            headerShown:true,
            headerTitleStyle:{fontWeight:"600"},
        }}>
            <Stack.Screen name="index" options={{ title:"Settings", headerShown:false }} />
            <Stack.Screen name="profile" options={{ title:"Profile" }} />
            <Stack.Screen name="CircleManagement" options={{ title:"Circle Management" }} />
            <Stack.Screen name="LocationHistory" options={{ title:"Location History" }} />
            <Stack.Screen name="LocationPrivacy" options={{ title:"Location Privacy" }} />
            <Stack.Screen name="NotificationSettings" options={{ title:"Notifications" }} />
        </Stack>
    )
}