import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { Host, Switch, Row } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { TAB_BAR_CONTENT_HEIGHT } from '@/constants/layout';
import { Font, FontBrand } from '@/constants/typography';
import type { FriendLocation } from '@/types/location';
import { Accent, type ThemeColors } from '@/constants/theme';

export type MapFilterChip = 'all' | 'friends' | 'places';

type AccentType = typeof Accent;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name.slice(0, 2) || '??').toUpperCase();
}

function relativeTime(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Just now';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  return 'Earlier';
}

const CHIPS: { id: MapFilterChip; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'friends', label: 'Friends' },
  { id: 'places', label: 'Places' },
];

export type MapTabChromeProps = {
  colors: ThemeColors;
  accent: AccentType;
  username: string;
  sharing: boolean;
  onToggleShare: (v: boolean) => void;
  locations: FriendLocation[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  filter: MapFilterChip;
  onFilterChange: (f: MapFilterChip) => void;
  onOpenMenu: () => void;
  onSOS: () => void;
  onAddPlace: () => void;
  onRecenter: () => void;
};

export function MapTabChrome({
  colors,
  accent,
  username,
  sharing,
  onToggleShare,
  locations,
  searchQuery,
  onSearchQueryChange,
  searchOpen,
  onToggleSearch,
  filter,
  onFilterChange,
  onOpenMenu,
  onSOS,
  onAddPlace,
  onRecenter,
}: MapTabChromeProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + TAB_BAR_CONTENT_HEIGHT + 16;
  const feedItems = locations.slice(0, 3);
  const emptyFeedText = sharing
    ? 'No friends sharing location yet. Invite your circle from Friends.'
    : 'Turn on Live to share and see your circle on the map.';

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        pointerEvents="box-none"
        style={[styles.topWrap, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}>
        <Host matchContents>
          <GlassCard intensity="medium" borderRadius={16} glowAccent style={styles.headerCard}>
            <Row spacing={10} alignment="center">
              <Pressable onPress={onOpenMenu} style={styles.avatarWrap}>
                <View style={[styles.avatar, { borderColor: accent.cyan }]}>
                  <NativeTypography variant="caption" color={colors.textPrimary} textStyle={{ fontFamily: Font.bold }}>
                    {initials(username)}
                  </NativeTypography>
                </View>
                {sharing ? (
                  <View style={[styles.liveDot, { backgroundColor: accent.green, borderColor: colors.bg }]} />
                ) : null}
              </Pressable>
              <NativeTypography
                variant="title"
                color={accent.cyan}
                textStyle={{ flex: 1, fontFamily: FontBrand.bold, letterSpacing: -0.3 }}>
                Connekta
              </NativeTypography>
              <Row spacing={4} alignment="center">
                <NativeTypography
                  variant="caption"
                  color={colors.textMuted}
                  textStyle={{ fontFamily: Font.medium, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Live
                </NativeTypography>
                <Switch value={sharing} onValueChange={onToggleShare} />
                <GlassIconButton name="search" onPress={onToggleSearch} size={22} />
              </Row>
            </Row>
          </GlassCard>
        </Host>

        {searchOpen ? (
          <Host matchContents>
            <GlassCard intensity="medium" borderRadius={20} style={styles.searchCard}>
              <Row spacing={8} alignment="center">
                <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                <RNTextInput
                  value={searchQuery}
                  onChangeText={onSearchQueryChange}
                  placeholder="Find friends or places…"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.searchInput, { color: colors.textPrimary, fontFamily: Font.regular }]}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </Row>
              <View style={styles.chipRow}>
                {CHIPS.map((c) => {
                  const active = filter === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => onFilterChange(c.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? `${accent.cyan}22` : colors.surface,
                          borderColor: active ? accent.cyan : colors.glassBorderLight,
                        },
                      ]}>
                      <NativeTypography
                        variant="caption"
                        color={active ? accent.cyan : colors.textMuted}
                        textStyle={{ fontFamily: Font.semibold, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        {c.label}
                      </NativeTypography>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </Host>
        ) : null}
      </View>

      <View pointerEvents="box-none" style={[styles.fabColumn, { top: insets.top + 120, right: 16 }]}>
        <Host matchContents>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={[styles.fabSos, { backgroundColor: accent.sos, shadowColor: accent.sos }]}>
              <GlassIconButton name="warning" onPress={onSOS} size={28} color="#fff" />
            </View>
            <GlassIconButton name="add" onPress={onAddPlace} size={26} style={styles.fabGlass} />
            <GlassIconButton name="locate" onPress={onRecenter} size={22} style={styles.fabGlassSmall} />
          </View>
        </Host>
      </View>

      <View pointerEvents="box-none" style={[styles.bottomWrap, { paddingBottom: bottomPad, paddingHorizontal: 16 }]}>
        <NativeTypography
          variant="caption"
          color={colors.textMuted}
          textStyle={{ fontFamily: Font.semibold, letterSpacing: 2, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' }}>
          LIVE FEED
        </NativeTypography>
        <Host matchContents>
          <GlassCard intensity="medium" borderRadius={16} style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
            {feedItems.length === 0 ? (
              <NativeTypography variant="caption" color={colors.textMuted}>
                {emptyFeedText}
              </NativeTypography>
            ) : (
              feedItems.map((f, i) => {
                const feedLine = `${f.username} is live on the map`;
                return (
                  <View
                    key={f.id}
                    style={[styles.feedRow, i > 0 && { marginTop: 12, opacity: i === 1 ? 0.9 : 0.75 }]}>
                    <View style={[styles.feedAvatar, { backgroundColor: `${accent.cyan}33`, borderColor: accent.cyan }]}>
                      <NativeTypography variant="caption" color={accent.cyan} textStyle={{ fontFamily: Font.bold }}>
                        {initials(f.username)}
                      </NativeTypography>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <NativeTypography variant="body" color={colors.textPrimary}>
                        {feedLine}
                      </NativeTypography>
                      <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 2 }}>
                        {relativeTime(f.updated_at)}
                      </NativeTypography>
                    </View>
                  </View>
                );
              })
            )}
          </GlassCard>
        </Host>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerCard: { paddingVertical: 10, paddingHorizontal: 14 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,219,233,0.12)',
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  searchCard: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  fabColumn: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  fabSos: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGlass: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  fabGlassSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
