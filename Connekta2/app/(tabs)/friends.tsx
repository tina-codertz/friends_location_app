import { useCallback, useState } from 'react';
import { Alert, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Host, Column, Text, List, ListItem, Button } from '@expo/ui';
import { useAuth } from '@/context/AuthContext';
import { friendsAPI, getApiErrorMessage, type FriendUser } from '@/services/api';

export default function FriendsScreen() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [f, inc] = await Promise.all([friendsAPI.list(), friendsAPI.incoming()]);
      if (f.success) setFriends(f.friends);
      if (inc.success) setIncoming(inc.incoming);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const accept = async (id: string) => {
    try {
      const res = await friendsAPI.accept(id);
      if (res.success) {
        setIncoming((prev) => prev.filter((u) => u.id !== id));
        void load();
      } else {
        Alert.alert('Accept failed', res.message ?? 'No pending request');
      }
    } catch (e) {
      Alert.alert('Accept failed', getApiErrorMessage(e, 'Could not accept'));
    }
  };

  const reject = async (id: string) => {
    try {
      const res = await friendsAPI.reject(id);
      if (res.success) setIncoming((prev) => prev.filter((u) => u.id !== id));
    } catch {
      Alert.alert('Error', 'Could not decline request');
    }
  };

  return (
    <View style={styles.shell}>
      <Host style={{ flex: 1 }}>
        <Text textStyle={{ fontSize: 28, fontWeight: '700' }} style={{ padding: 20 }}>
          My Circle
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <Column spacing={16}>
            {incoming.length > 0 && (
              <Column spacing={8} style={{ paddingHorizontal: 20 }}>
                <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>Pending requests</Text>
                {incoming.map((u) => (
                  <View key={u.id} style={styles.reqRow}>
                    <Text>{u.username}</Text>
                    <Button variant="filled" label="Accept" onPress={() => void accept(u.id)} />
                    <Button variant="outlined" label="Decline" onPress={() => void reject(u.id)} />
                  </View>
                ))}
              </Column>
            )}

            <List>
              {friends.length === 0 ? (
                <ListItem>No friends yet — invite someone from Circle Management</ListItem>
              ) : (
                friends.map((f) => (
                  <ListItem key={f.id} supportingText="Circle member">
                    {f.username}
                  </ListItem>
                ))
              )}
            </List>
          </Column>
        )}
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff' },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});