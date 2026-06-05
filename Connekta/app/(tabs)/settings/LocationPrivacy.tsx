import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAppTheme } from '@/context/ThemeContext';
import { locationAPI } from '@/services/api';
import { stopBackgroundLocationSharing } from '@/services/location-sharing';
import { Font, Type } from '@/constants/typography';
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
  const insets = useSafeAreaInsets();
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
          await stopBackgroundLocationSharing();
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Location privacy</Text>
      <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
        Control what your circle sees when live sharing is on. Your email and full history stay private.
      </Text>

      {loading ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={accent.cyan} />
        </GlassCard>
      ) : (
        <>
          <GlassCard borderRadius={16} intensity="medium" style={{ marginBottom: 16, padding: 14 }}>
            <Text style={[Type.caption, { color: colors.textMuted }]}>Live sharing</Text>
            <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold, marginTop: 4 }]}>
              {sharing ? 'On — circle can see you' : 'Off — location hidden'}
            </Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 6 }]}>
              {sharing
                ? `Showing: ${shareModeLabel(mode)}`
                : 'Turn on live sharing from the map or Share Location when you are ready.'}
            </Text>
          </GlassCard>

          {MODES.map((option) => {
            const selected = mode === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => void onSelectMode(option)}
                disabled={busy}
                activeOpacity={0.85}
                style={{ marginBottom: 10 }}
              >
                <GlassCard
                  borderRadius={16}
                  intensity={selected ? 'medium' : 'light'}
                  style={{
                    padding: 14,
                    borderWidth: 1,
                    borderColor: selected ? accent.electricBlue : colors.divider,
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: selected ? `${accent.electricBlue}33` : colors.glassBgLight },
                      ]}
                    >
                      <Ionicons
                        name={MODE_ICONS[option]}
                        size={22}
                        color={selected ? accent.electricBlue : colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                        {shareModeLabel(option)}
                      </Text>
                      <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
                        {shareModeDescription(option)}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={accent.electricBlue} />
                    ) : null}
                  </View>
                </GlassCard>
              </TouchableOpacity>
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
            marginTop: 12,
          },
        ]}
      >
        <Ionicons name="shield-checkmark" size={20} color={accent.cyan} style={{ marginRight: 10 }} />
        <Text style={[Type.caption, { color: colors.textMuted, flex: 1 }]}>
          Only circle members can read your shared position. Account email and location history are visible only to you.
        </Text>
      </View>
    </ScrollView>
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
