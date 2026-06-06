import { useState, useEffect } from 'react';
import { Alert, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Host, Column, Text, TextInput, Button } from '@expo/ui';
import { useAuth } from '@/context/AuthContext';
import { firebaseAuthErrorMessage } from '@/connekta-firebase';
import { validateUsername } from '@/utils/username';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setUsername(user?.username ?? '');
  }, [user?.username, editing]);

  const onSave = async () => {
    const check = validateUsername(username);
    if (!check.ok) {
      Alert.alert('Invalid username', check.message);
      return;
    }
    if (check.value === user?.username) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateProfile(check.value);
      Alert.alert('Saved', 'Username updated.');
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', firebaseAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Leave Connekta on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <View style={styles.shell}>
      <Host style={{ flex: 1 }}>
        <Column spacing={16} style={{ padding: 24 }}>
          <Text textStyle={{ fontSize: 28, fontWeight: '700' }}>Profile</Text>

          <Text textStyle={{ fontSize: 14, color: '#666' }}>Email</Text>
          <Text textStyle={{ fontSize: 16 }}>{user?.email ?? '—'}</Text>

          <Text textStyle={{ fontSize: 14, color: '#666' }}>Username</Text>
          {editing ? (
            <TextInput placeholder="Username" onChangeText={setUsername} defaultValue={username} />
          ) : (
            <Text textStyle={{ fontSize: 16 }}>{user?.username ?? '—'}</Text>
          )}

          {saving ? (
            <ActivityIndicator />
          ) : editing ? (
            <Column spacing={8}>
              <Button variant="filled" label="Save" onPress={() => void onSave()} />
              <Button variant="text" label="Cancel" onPress={() => setEditing(false)} />
            </Column>
          ) : (
            <Button variant="outlined" label="Edit username" onPress={() => setEditing(true)} />
          )}

          <Button variant="filled" label="Sign out" onPress={onSignOut} />
        </Column>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff' },
});