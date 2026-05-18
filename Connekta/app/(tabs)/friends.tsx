import React, { useCallback, useState, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { friendsAPI, type FriendUser } from '@/services/api';
import { Font, Type } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { formatInviteMessage } from '@/utils/invite';

function apiErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const data = (e as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}

export default function FriendsTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { invite: inviteParam } = useLocalSearchParams<{ invite?: string }>();
  const { user } = useAuth();
  const { colors, accent } = useAppTheme();
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FriendUser[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const deepLinkHandled = useRef(false);

  const loadLists = useCallback(async () => {
    try {
      const [f, inc, inv] = await Promise.all([
        friendsAPI.list(),
        friendsAPI.incoming(),
        friendsAPI.getInvite(),
      ]);
      if (f.success) setFriends(f.friends);
      if (inc.success) setIncoming(inc.incoming);
      if (inv.success && inv.invite) setMyInviteCode(inv.invite.code);
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

  React.useEffect(() => {
    if (typeof inviteParam === 'string' && inviteParam.trim() && !deepLinkHandled.current) {
      deepLinkHandled.current = true;
      setJoinCode(inviteParam.trim().toUpperCase());
    }
  }, [inviteParam]);

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

  const ensureInviteCode = async (): Promise<string | null> => {
    if (myInviteCode) return myInviteCode;
    setGeneratingInvite(true);
    try {
      const res = await friendsAPI.generateInvite();
      if (res.success && res.code) {
        setMyInviteCode(res.code);
        return res.code;
      }
      Alert.alert('Error', res.message ?? 'Could not create invite code');
      return null;
    } catch {
      Alert.alert('Error', 'Could not create invite code');
      return null;
    } finally {
      setGeneratingInvite(false);
    }
  };

  const shareInvite = async () => {
    const code = await ensureInviteCode();
    if (!code || !user?.username) return;
    try {
      await Share.share({
        message: formatInviteMessage(code, user.username),
        title: 'Join my Connekta circle',
      });
    } catch {
      /* cancelled */
    }
  };

  const shareToContact = async () => {
    const code = await ensureInviteCode();
    if (!code || !user?.username) return;
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        await shareInvite();
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        try {
          await Share.share({
            message: formatInviteMessage(code, user.username),
            title: 'Connekta Invite',
          });
        } catch {
          /* cancelled */
        }
      }
    } catch {
      await shareInvite();
    }
  };

  const joinWithCode = async (codeOverride?: string) => {
    const code = (codeOverride ?? joinCode).trim().toUpperCase();
    if (code.length < 6) {
      Alert.alert('Invalid code', 'Enter the invite code from your friend.');
      return;
    }
    setJoining(true);
    try {
      const res = await friendsAPI.joinWithCode(code);
      if (res.success) {
        setJoinCode('');
        void loadLists();
        Alert.alert(
          'Request sent',
          res.circle_owner
            ? `Friend request sent to ${res.circle_owner.username}.`
            : 'Friend request sent.'
        );
      } else {
        Alert.alert('Could not join', res.message ?? 'Invalid or expired code');
      }
    } catch (e) {
      Alert.alert('Could not join', apiErrorMessage(e, 'Check the code and try again.'));
    } finally {
      setJoining(false);
    }
  };

  const send = async (id: number) => {
    try {
      const res = await friendsAPI.sendRequest(id);
      if (res.success) {
        setResults((prev) => prev.filter((u) => u.id !== id));
        void loadLists();
        if (res.message?.toLowerCase().includes('already')) {
          Alert.alert('Already connected', res.message);
        }
      } else {
        Alert.alert('Request failed', res.message ?? 'Could not send request');
      }
    } catch (e) {
      const msg = apiErrorMessage(e, 'Could not send request');
      if (msg.toLowerCase().includes('already')) {
        setResults((prev) => prev.filter((u) => u.id !== id));
        void loadLists();
        Alert.alert('Already connected', msg);
        return;
      }
      Alert.alert('Request failed', msg);
    }
  };

  const accept = async (id: number) => {
    try {
      const res = await friendsAPI.accept(id);
      if (res.success) {
        setIncoming((prev) => prev.filter((u) => u.id !== id));
        void loadLists();
      } else {
        Alert.alert('Accept failed', res.message ?? 'No pending request');
        void loadLists();
      }
    } catch (e) {
      const msg = apiErrorMessage(e, 'Could not accept request');
      if (msg.toLowerCase().includes('pending')) {
        void loadLists();
        return;
      }
      Alert.alert('Accept failed', msg);
    }
  };

  const reject = async (id: number) => {
    try {
      const res = await friendsAPI.reject(id);
      if (res.success) {
        setIncoming((prev) => prev.filter((u) => u.id !== id));
      }
    } catch {
      Alert.alert('Error', 'Could not decline request');
    }
  };

  const renderHeader = () => (
      <View style={{ gap: 16, marginBottom: 8 }}>
        <Text style={[Type.hero, { color: colors.textPrimary, paddingHorizontal: 4 }]}>My Circle</Text>

        <GlassCard borderRadius={22} intensity="heavy" glowAccent style={{ paddingVertical: 14 }}>
          <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 6 }]}>Invite to your circle</Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 12 }]}>
            Share a code or link. Friends join by entering the code below or opening your link.
          </Text>
          {myInviteCode ? (
            <Text
              style={{
                fontFamily: Font.bold,
                fontSize: 24,
                letterSpacing: 4,
                color: accent.electricBlue,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {myInviteCode}
            </Text>
          ) : null}
          <View style={{ gap: 10 }}>
            <GlassButton
              title={generatingInvite ? 'Preparing…' : myInviteCode ? 'Share invite link' : 'Get invite code & share'}
              onPress={shareInvite}
              variant="primary"
              fullWidth
              disabled={generatingInvite}
            />
            <GlassButton
              title="Manage circle"
              onPress={() => router.push('/(tabs)/settings/CircleManagement')}
              variant="secondary"
              fullWidth
            />
          </View>
        </GlassCard>

        <GlassCard borderRadius={22} style={{ paddingVertical: 14 }} intensity="medium">
          <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 8 }]}>Join with invite code</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="CODE"
              placeholderTextColor={colors.inputPlaceholder}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBg,
                  fontFamily: Font.semibold,
                  flex: 1,
                  letterSpacing: 3,
                  textAlign: 'center',
                },
              ]}
            />
            <GlassButton
              title={joining ? '…' : 'Join'}
              onPress={() => joinWithCode()}
              variant="primary"
              size="small"
              disabled={joining}
            />
          </View>
        </GlassCard>

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
