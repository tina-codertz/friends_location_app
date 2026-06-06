import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Column, Text, Button } from '@expo/ui';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.shell}>
      <Host style={{ flex: 1, justifyContent: 'center' }}>
        <Column spacing={24} style={{ padding: 32 }}>
          <Text textStyle={{ fontSize: 36, fontWeight: '800', textAlign: 'center' }}>
            Connekta
          </Text>
          <Text textStyle={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
            Share your location with friends you trust. Stay connected, stay safe.
          </Text>
          <Button
            variant="filled"
            label="Get Started"
            onPress={() => router.push('/auth/AuthScreen')}
          />
        </Column>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff' },
});