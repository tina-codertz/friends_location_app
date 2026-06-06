import React, { useCallback, useState } from 'react';
import { View, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { locationAPI } from '@/services/api';
import { stopLiveSharing } from '@/services/location-sharing';
import { Font } from '@/constants/typography';
import {
  shareModeDescription,
  shareModeLabel,
  type ShareMode,
} from '@/utils/location-privacy';

const MODES: ShareMode[] = ['exact', 'bubble', 'paused'];

const MODE_ICONS: Record<ShareMode, keyof typeof Ionicons.glyphMap> = {
  exact: 'locate',
  bubble: 'radio-button-on',
  paused: 'eye-off',
};

export default function LocationPrivacyScreen() {
  const { colors, accent } = useAppTheme();
  const [mode, setMode] = useState<ShareMode>('paused');
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const state = await locationAPI.myState();
      if (state.success) {
        setMode(state.share_mode);
        setSharing(state.sharing);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onSelectMode = useCallback(
    async (next: ShareMode) => {
      if (busy || next === mode) return;
      setBusy(true);
      try {
        if (next === 'paused') {
          await stopLiveSharing();
        }
        const res = await locationAPI.setShareMode(next);
        if (!res.success) {
          Alert.alert('Could not update', 'Try again in a moment.');
          return;
        }
        setMode(next);
        setSharing(res.sharing);
      } catch {
        Alert.alert('Error', 'Could not update location privacy.');
      } finally {
        setBusy(false);
      }
    },
    [busy, mode],
  );

  const liveSharingStatus = sharing ? 'On — circle can see you' : 'Off — location hidden';
  const liveSharingDetail = sharing
    ? `Showing: ${shareModeLabel(mode)}`
    : 'Turn on live sharing from the map or Share Location when you are ready.';

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 40 }}>
      <NativeTypography variant="hero" color={colors.textPrimary}>
        Location privacy
      </NativeTypography>
      <NativeTypography variant="body" color={colors.textMuted}>
        Control what your circle sees when live sharing is on. Your email and full history stay private.
      </NativeTypography>

      {loading ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={accent.cyan} />
        </GlassCard>
      ) : (
        <>
          <GlassCard borderRadius={16} intensity="medium" style={{ padding: 14 }}>
            <NativeTypography variant="caption" color={colors.textMuted}>
              Live sharing
            </NativeTypography>
            <NativeTypography
              variant="body"
              color={colors.textPrimary}
              textStyle={{ fontFamily: Font.semibold, marginTop: 4 }}>
              {liveSharingStatus}
            </NativeTypography>
            <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 6 }}>
              {liveSharingDetail}
            </NativeTypography>
          </GlassCard>

          {MODES.map((option) => {
            const selected = mode === option;
            return (
              <Pressable
                key={option}
                onPress={() => void onSelectMode(option)}
                disabled={busy}
                style={{ opacity: busy ? 0.7 : 1 }}>
                <GlassCard
                  borderRadius={16}
                  intensity={selected ? 'medium' : 'light'}
                  style={{
                    padding: 14,
                    borderWidth: 1,
                    borderColor: selected ? accent.electricBlue : colors.divider,
                  }}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: selected ? `${accent.electricBlue}33` : colors.glassBgLight },
                      ]}>
                      <Ionicons
                        name={MODE_ICONS[option]}
                        size={22}
                        color={selected ? accent.electricBlue : colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <NativeTypography
                        variant="body"
                        color={colors.textPrimary}
                        textStyle={{ fontFamily: Font.semibold }}>
                        {shareModeLabel(option)}
                      </NativeTypography>
                      <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 4 }}>
                        {shareModeDescription(option)}
                      </NativeTypography>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={accent.electricBlue} />
                    ) : null}
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </>
      )}

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: `${accent.cyan}11`,
            borderColor: `${accent.cyan}44`,
          },
        ]}>
        <Ionicons name="shield-checkmark" size={20} color={accent.cyan} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <NativeTypography variant="caption" color={colors.textMuted}>
            Only circle members can read your shared position. Account email and location history are visible only to you.
          </NativeTypography>
        </View>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
