import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { Font } from '@/constants/typography';
import { friendsAPI, getApiErrorMessage, type FriendUser } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildCircleInviteLink, formatInviteMessage } from '@/utils/invite';

export default function CircleManagement() {
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
          'Joined circle',
          res.circle_owner
            ? `You and ${res.circle_owner.username} are now in each other's circle.`
            : 'You joined the circle. Open My Circle to see your friends.'
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

  const expiryLabel = inviteExpiry
    ? `Expires ${new Date(inviteExpiry).toLocaleDateString()}`
    : '';
  const inviteLinkText = inviteCode ? `Link: ${buildCircleInviteLink(inviteCode)}` : '';

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
              ]}>
              <Ionicons name="person" size={18} color={accent.electricBlue} />
            </View>
            <NativeTypography
              variant="body"
              color={colors.textPrimary}
              textStyle={{ flex: 1, fontFamily: Font.medium }}>
              {item.username}
            </NativeTypography>
          </View>
          {isRemoving ? (
            <ActivityIndicator size="small" color={accent.coral} />
          ) : (
            <GlassIconButton
              name="trash-outline"
              onPress={() => confirmRemoveMember(item)}
              danger
              size={22}
            />
          )}
        </View>
      </GlassCard>
    );
  };

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 40 }}>
      <NativeTypography variant="hero" color={colors.textPrimary}>
        Circle management
      </NativeTypography>
      <NativeTypography variant="body" color={colors.textMuted}>
        Generate a code, share your invite link, or join another circle with a code. View friends and the map on the My Circle tab.
      </NativeTypography>

      <GlassCard borderRadius={16} intensity="heavy" glowAccent>
        <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 8 }}>
          Your invite code
        </NativeTypography>
        <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 14 }}>
          Share this code or link so others can request to join your circle.
        </NativeTypography>

        {inviteCode ? (
          <Pressable onPress={copyCode}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.tealBorder,
                marginBottom: 12,
              }}>
              <NativeTypography
                variant="hero"
                color={accent.electricBlue}
                textStyle={{ fontFamily: Font.bold, letterSpacing: 6 }}>
                {inviteCode}
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 6 }}>
                Tap to share code
              </NativeTypography>
            </View>
          </Pressable>
        ) : (
          <NativeTypography variant="body" color={colors.textMuted} textStyle={{ marginBottom: 12 }}>
            No active code yet.
          </NativeTypography>
        )}

        {inviteExpiry ? (
          <NativeTypography variant="caption" color={colors.textTertiary} textStyle={{ marginBottom: 12 }}>
            {expiryLabel}
          </NativeTypography>
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
          <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 12 }}>
            {inviteLinkText}
          </NativeTypography>
        ) : null}
      </GlassCard>

      <GlassCard borderRadius={16} intensity="medium">
        <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 8 }}>
          Join a circle
        </NativeTypography>
        <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 12 }}>
          Enter a friend's invite code to request joining their circle.
        </NativeTypography>
        <GlassInput
          layout="stacked"
          placeholder="INVITE CODE"
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
        />
        <GlassButton
          title={joining ? 'Joining…' : 'Join with code'}
          onPress={joinCircle}
          variant="tonal"
          fullWidth
          disabled={joining}
        />
      </GlassCard>

      <NativeTypography variant="section" color={colors.textPrimary}>
        {`Members (${friends.length})`}
      </NativeTypography>

      {loading ? (
        <ActivityIndicator color={accent.electricBlue} />
      ) : friends.length === 0 ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <NativeTypography variant="body" color={colors.textMuted} textStyle={{ marginTop: 8 }}>
            No friends in your circle yet
          </NativeTypography>
        </GlassCard>
      ) : (
        <FlatList data={friends} renderItem={renderFriendItem} keyExtractor={(item) => String(item.id)} scrollEnabled={false} />
      )}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
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
});
