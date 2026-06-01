import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Share,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { friendsAPI, getApiErrorMessage, type FriendUser } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildCircleInviteLink, formatInviteMessage } from '@/utils/invite';

export default function CircleManagement() {
  const insets = useSafeAreaInsets();
  const { invite: inviteParam } = useLocalSearchParams<{ invite?: string }>();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, inviteRes] = await Promise.all([friendsAPI.list(), friendsAPI.getInvite()]);
      if (friendsRes.success) setFriends(friendsRes.friends);
      if (inviteRes.success && inviteRes.invite) {
        setInviteCode(inviteRes.invite.code);
        setInviteExpiry(inviteRes.invite.expires_at);
      }
    } catch {
      Alert.alert('Error', 'Failed to load circle.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  React.useEffect(() => {
    if (typeof inviteParam === 'string' && inviteParam.trim()) {
      setJoinCode(inviteParam.trim().toUpperCase());
    }
  }, [inviteParam]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await friendsAPI.generateInvite();
      if (res.success && res.code) {
        setInviteCode(res.code);
        setInviteExpiry(res.expires_at ?? null);
        Alert.alert('Invite code ready', `Your code is ${res.code}`);
      } else {
        Alert.alert('Error', res.message ?? 'Could not generate code');
      }
    } catch {
      Alert.alert('Error', 'Could not generate invite code.');
    } finally {
      setGenerating(false);
    }
  };

  const shareInvite = async () => {
    if (!inviteCode || !user?.username) {
      Alert.alert('Generate a code first', 'Tap Generate code to create your circle invite.');
      return;
    }
    try {
      await Share.share({
        message: formatInviteMessage(inviteCode, user.username),
        title: 'Join my Connekta circle',
      });
    } catch {
      /* cancelled */
    }
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({ message: inviteCode });
    } catch {
      /* cancelled */
    }
  };

  const joinCircle = async () => {
    const code = joinCode.trim();
    if (code.length < 6) {
      Alert.alert('Invalid code', 'Enter the 6–8 character invite code.');
      return;
    }
    setJoining(true);
    try {
      const res = await friendsAPI.joinWithCode(code);
      if (res.success) {
        setJoinCode('');
        void loadAll();
        Alert.alert(
          'Request sent',
          res.circle_owner
            ? `Friend request sent to ${res.circle_owner.username}. They can accept you in My Circle.`
            : 'Friend request sent.'
        );
      } else {
        Alert.alert('Could not join', res.message ?? 'Invalid or expired code. If this mentions Firestore rules, publish Connekta/connekta-firebase/rules/firestore.rules in Firebase Console.');
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Could not join', msg ?? 'Check the code and try again.');
    } finally {
      setJoining(false);
    }
  };

  const confirmRemoveMember = (member: FriendUser) => {
    Alert.alert(
      'Remove from circle',
      `Remove ${member.username} from your circle? They will no longer see your shared location.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void removeMember(member.id),
        },
      ]
    );
  };

  const removeMember = async (friendId: string) => {
    setRemovingId(friendId);
    try {
      const res = await friendsAPI.remove(friendId);
      if (res.success) {
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      } else {
        Alert.alert('Could not remove', res.message ?? 'Try again');
      }
    } catch (e: unknown) {
      Alert.alert('Could not remove', getApiErrorMessage(e, 'Try again'));
    } finally {
      setRemovingId(null);
    }
  };

  const renderFriendItem = ({ item }: { item: FriendUser }) => {
    const isRemoving = removingId === item.id;
    return (
      <GlassCard borderRadius={16} intensity="light" style={styles.memberCard}>
        <View style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <View
              style={[
                styles.memberAvatar,
                { backgroundColor: `${accent.electricBlue}22` },
              ]}
            >
              <Ionicons name="person" size={18} color={accent.electricBlue} />
            </View>
            <Text
              style={[Type.body, styles.memberName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.username}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => confirmRemoveMember(item)}
            disabled={isRemoving}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Remove ${item.username}`}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color={accent.coral} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={accent.coral} />
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
        gap: 16,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary }]}>Circle management</Text>
      <Text style={[Type.body, { color: colors.textMuted }]}>
        Generate a code, share your invite link, or join another circle with a code. View friends and the map on the My Circle tab.
      </Text>

      <GlassCard borderRadius={16} intensity="heavy" glowAccent>
        <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 8 }]}>Your invite code</Text>
        <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 14 }]}>
          Share this code or link so others can request to join your circle.
        </Text>

        {inviteCode ? (
          <TouchableOpacity onPress={copyCode} activeOpacity={0.8}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.tealBorder,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: Font.bold,
                  fontSize: 28,
                  letterSpacing: 6,
                  color: accent.electricBlue,
                }}
              >
                {inviteCode}
              </Text>
              <Text style={[Type.caption, { color: colors.textMuted, marginTop: 6 }]}>Tap to share code</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={[Type.body, { color: colors.textMuted, marginBottom: 12 }]}>No active code yet.</Text>
        )}

        {inviteExpiry ? (
          <Text style={[Type.caption, { color: colors.textTertiary, marginBottom: 12 }]}>
            Expires {new Date(inviteExpiry).toLocaleDateString()}
          </Text>
        ) : null}

        <View style={{ gap: 10 }}>
          <GlassButton
            title={generating ? 'Generating…' : inviteCode ? 'Refresh code' : 'Generate code'}
            onPress={generateCode}
            variant="primary"
            fullWidth
            disabled={generating}
          />
          <GlassButton title="Share invite link" onPress={shareInvite} variant="tonal" fullWidth disabled={!inviteCode} />
        </View>

        {inviteCode ? (
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 12 }]} numberOfLines={2}>
            Link: {buildCircleInviteLink(inviteCode)}
          </Text>
        ) : null}
      </GlassCard>

      <GlassCard borderRadius={16} intensity="medium">
        <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 8 }]}>Join a circle</Text>
        <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 12 }]}>
          Enter a friend&apos;s invite code to request joining their circle.
        </Text>
        <TextInput
          placeholder="INVITE CODE"
          placeholderTextColor={colors.inputPlaceholder}
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          style={[
            styles.codeInput,
            {
              color: colors.textPrimary,
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBg,
              fontFamily: Font.semibold,
            },
          ]}
        />
        <View style={{ height: 12 }} />
        <GlassButton
          title={joining ? 'Joining…' : 'Join with code'}
          onPress={joinCircle}
          variant="tonal"
          fullWidth
          disabled={joining}
        />
      </GlassCard>

      <Text style={[Type.section, { color: colors.textPrimary }]}>Members ({friends.length})</Text>

      {loading ? (
        <ActivityIndicator color={accent.electricBlue} />
      ) : friends.length === 0 ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={[Type.body, { color: colors.textMuted, marginTop: 8 }]}>No friends in your circle yet</Text>
        </GlassCard>
      ) : (
        <FlatList data={friends} renderItem={renderFriendItem} keyExtractor={(item) => String(item.id)} scrollEnabled={false} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  codeInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  memberCard: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    flex: 1,
    fontFamily: Font.medium,
  },
  removeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
