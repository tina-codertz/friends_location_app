import { Alert, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, List, ListItem, Text, Button, Column } from '@expo/ui';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_LINKS = [
  { title: 'Profile', route: '/(tabs)/settings/profile' },
  { title: 'Circle Management', route: '/(tabs)/settings/CircleManagement' },
  { title: 'Location History', route: '/(tabs)/settings/LocationHistory' },
  { title: 'Location Privacy', route: '/(tabs)/settings/LocationPrivacy' },
  { title: 'Notifications', route: '/(tabs)/settings/NotificationSettings' },
] as const;

export default function SettingsIndexScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const onSignOut = () => {
    Alert.alert('Sign out', 'Leave Connekta on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <View style={styles.shell}>
      <Host style={{ flex: 1 }}>
        <Column spacing={8} style={{ padding: 20 }}>
          <Text textStyle={{ fontSize: 28, fontWeight: '700' }}>Settings</Text>
          <Text textStyle={{ fontSize: 16, color: '#666' }}>
            {`Signed in as ${user?.username ?? user?.email ?? 'unknown'}`}
          </Text>
        </Column>

        <List>
          {SETTINGS_LINKS.map((item) => (
            <ListItem key={item.route} onPress={() => router.push(item.route)}>
              {item.title}
            </ListItem>
          ))}
        </List>

        <Column style={{ padding: 20 }}>
          <Button variant="outlined" label="Sign out" onPress={onSignOut} />
        </Column>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff' },
});