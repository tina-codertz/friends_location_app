import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { friendsAPI, type FriendUser } from '@/services/api';
import { Font, Type } from '@/constants/typography';

export default function FriendsTabScreen() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FriendUser[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const [f, inc] = await Promise.all([friendsAPI.list(), friendsAPI.incoming()]);
      if (f.success) setFriends(f.friends);
      if (inc.success) setIncoming(inc.incoming);
    } catch {
      /* network */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const onSearch = useCallback(async () => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await friendsAPI.search(q.trim());
      if (res.success) setResults(res.users);
    } finally {
      setSearching(false);
    }
  }, [q]);

  const shareToContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow access to contacts to share an invite.');
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const url = Linking.createURL('/friends', { scheme: 'connekta' });
        const message = `Hey! Let's connect on Connekta and share our locations. Join: ${url}`;
        try {
          await Share.share({ message, title: 'Connekta Invite' });
        } catch {
          /* cancelled */
        }
      }
    } catch (err) {
      console.error('Error sharing to contact:', err);
    }
  };

  const send = async (id: number) => {
    const res = await friendsAPI.sendRequest(id);
    if (res.success) {
      setResults((prev) => prev.filter((u) => u.id !== id));
      void loadLists();
    }
  };

  const accept = async (id: number) => {
    const res = await friendsAPI.accept(id);
    if (res.success) void loadLists();
  };

  const reject = async (id: number) => {
    const res = await friendsAPI.reject(id);
    if (res.success) void loadLists();
  };

  const renderHeader = () => (
      <View style={{ gap: 16, marginBottom: 8 }}>
        <Text style={[Type.hero, { color: colors.textPrimary, paddingHorizontal: 4 }]}>Friends</Text>

        <GlassCard borderRadius={22} style={{ paddingVertical: 14 }} intensity="medium">
          <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 8 }]}>Discover</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Search username"
              placeholderTextColor={colors.inputPlaceholder}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={onSearch}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBg,
                  fontFamily: Font.regular,
                  flex: 1,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <GlassButton title="Go" onPress={onSearch} variant="secondary" size="small" />
            <TouchableOpacity
              onPress={shareToContact}
              style={{
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="share-social" size={20} color={accent.electricBlue} />
            </TouchableOpacity>
          </View>
          {searching ? (
            <ActivityIndicator style={{ marginTop: 12 }} color={accent.electricBlue} />
          ) : (
            <View style={{ marginTop: 12, gap: 8 }}>
              {results.map((u) => (
                <View key={u.id} style={[styles.userRow, { borderColor: colors.divider }]}>
                  <Text style={[Type.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>{u.username}</Text>
                  <GlassButton title="Add" onPress={() => send(u.id)} variant="primary" size="small" />
                </View>
              ))}
              {q.length >= 2 && !searching && results.length === 0 ? (
                <Text style={[Type.caption, { color: colors.textMuted }]}>No matches</Text>
              ) : null}
            </View>
          )}
        </GlassCard>

        {incoming.length > 0 ? (
          <GlassCard borderRadius={22} intensity="heavy" glowAccent style={{ paddingVertical: 14 }}>
            <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 10 }]}>Requests</Text>
            {incoming.map((u) => (
              <View key={u.id} style={[styles.reqRow, { borderColor: colors.divider }]}>
                <Text style={[Type.body, { color: colors.textPrimary, flex: 1, fontFamily: Font.medium }]}>
                  {u.username}
                </Text>
                <TouchableOpacity onPress={() => accept(u.id)} style={[styles.chip, { backgroundColor: accent.electricBlue }]}>
                  <Text style={{ color: '#fff', fontFamily: Font.semibold }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => reject(u.id)} style={[styles.chip, { borderWidth: 1, borderColor: colors.glassBorderMedium }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: Font.medium }}>Decline</Text>
                </TouchableOpacity>
              </View>
            ))}
          </GlassCard>
        ) : null}

        <Text style={[Type.section, { color: colors.textPrimary, paddingHorizontal: 4 }]}>Your circle</Text>
      </View>
    );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accent.electricBlue} />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <FlatList
        data={friends}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
          gap: 12,
        }}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadLists();
            }}
            tintColor={accent.electricBlue}
          />
        }
        renderItem={({ item }) => (
          <GlassCard borderRadius={22} intensity="light" animated animationDelay={50} style={{ paddingVertical: 14 }}>
            <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>{item.username}</Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>Mutual friend</Text>
          </GlassCard>
        )}
        ListEmptyComponent={
          <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
            No friends yet. Discover people above.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
});
