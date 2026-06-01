import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { TAB_BAR_CONTENT_HEIGHT } from '@/constants/layout';
import { Font, FontBrand, Type } from '@/constants/typography';
import type { FriendLocation } from '@/types/location';
import type { ThemeColors } from '@/constants/theme';
import type { Accent } from '@/constants/theme';

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
  friendCount: number;
  placeCount: number;
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
  friendCount,
  placeCount,
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

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Top header */}
      <View
        pointerEvents="box-none"
        style={[styles.topWrap, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}
      >
        <GlassCard intensity="medium" borderRadius={16} glowAccent style={styles.headerCard}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onOpenMenu} activeOpacity={0.85} style={styles.avatarWrap}>
              <View style={[styles.avatar, { borderColor: accent.cyan }]}>
                <Text style={[styles.avatarText, { color: colors.textPrimary }]}>{initials(username)}</Text>
              </View>
              {sharing ? (
                <View style={[styles.liveDot, { backgroundColor: accent.green, borderColor: colors.bg }]} />
              ) : null}
            </TouchableOpacity>
            <Text style={[styles.brand, { color: accent.cyan, fontFamily: FontBrand.bold }]}>Connekta</Text>
            <View style={styles.headerActions}>
              <View style={styles.sharePill}>
                <Text style={[styles.shareLabel, { color: colors.textMuted, fontFamily: Font.medium }]}>Live</Text>
                <Switch
                  value={sharing}
                  onValueChange={onToggleShare}
                  trackColor={{ false: colors.divider, true: `${accent.cyan}66` }}
                  thumbColor={sharing ? accent.cyan : colors.textTertiary}
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>
              <TouchableOpacity onPress={onToggleSearch} style={styles.iconBtn} activeOpacity={0.8}>
                <Ionicons name="search" size={22} color={accent.cyan} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {searchOpen ? (
          <GlassCard intensity="medium" borderRadius={20} style={styles.searchCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={20} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                placeholder="Find friends or places…"
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.searchInput, { color: colors.textPrimary, fontFamily: Font.regular }]}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? accent.cyan : colors.textMuted, fontFamily: Font.semibold },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        ) : null}
      </View>

      {/* Right FABs */}
      <View pointerEvents="box-none" style={[styles.fabColumn, { top: insets.top + 120, right: 16 }]}>
        <TouchableOpacity
          onPress={onSOS}
          activeOpacity={0.85}
          style={[styles.fabSos, { backgroundColor: accent.sos, shadowColor: accent.sos }]}
        >
          <Ionicons name="warning" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddPlace}
          activeOpacity={0.85}
          style={[styles.fabGlass, { borderColor: colors.glassBorderMedium, backgroundColor: colors.glassBgHeavy }]}
        >
          <Ionicons name="add" size={26} color={accent.cyan} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRecenter}
          activeOpacity={0.85}
          style={[styles.fabGlassSmall, { borderColor: colors.glassBorderMedium, backgroundColor: colors.glassBgHeavy }]}
        >
          <Ionicons name="locate" size={22} color={accent.cyan} />
        </TouchableOpacity>
      </View>

      {/* Bottom live feed */}
      <View pointerEvents="box-none" style={[styles.bottomWrap, { paddingBottom: bottomPad, paddingHorizontal: 16 }]}>
        <Text style={[styles.feedLabel, { color: colors.textMuted, fontFamily: Font.semibold }]}>LIVE FEED</Text>
        <GlassCard intensity="medium" borderRadius={16} style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
          {feedItems.length === 0 ? (
            <Text style={[Type.caption, { color: colors.textMuted, fontFamily: Font.regular }]}>
              {sharing
                ? 'No friends sharing location yet. Invite your circle from Friends.'
                : 'Turn on Live to share and see your circle on the map.'}
            </Text>
          ) : (
            feedItems.map((f, i) => (
              <View
                key={f.id}
                style={[styles.feedRow, i > 0 && { marginTop: 12, opacity: i === 1 ? 0.9 : 0.75 }]}
              >
                <View style={[styles.feedAvatar, { backgroundColor: `${accent.cyan}33`, borderColor: accent.cyan }]}>
                  <Text style={{ color: accent.cyan, fontFamily: Font.bold, fontSize: 13 }}>
                    {initials(f.username)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[Type.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
                    <Text style={{ fontFamily: Font.bold }}>{f.username}</Text>
                    <Text style={{ fontFamily: Font.regular }}> is live on the map</Text>
                  </Text>
                  <Text style={[Type.caption, { color: colors.textMuted, marginTop: 2, fontFamily: Font.regular }]}>
                    {relativeTime(f.updated_at)} · {friendCount} friends · {placeCount} places
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerCard: { paddingVertical: 10, paddingHorizontal: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  avatarText: { fontSize: 14, fontWeight: '700' },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  brand: { flex: 1, fontSize: 22, letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sharePill: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shareLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  iconBtn: { padding: 6 },
  searchCard: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  fabColumn: { position: 'absolute', alignItems: 'center', gap: 12, zIndex: 10 },
  fabSos: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGlass: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00DBE9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabGlassSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 },
  feedLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
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
