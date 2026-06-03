import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaceKind } from '@/types/places';
import { PLACE_KIND_META } from '@/utils/place-kind';
import { Font } from '@/constants/typography';

type Props = {
  label: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  /** When set, shows category icon instead of a plain dot. */
  placeKind?: PlaceKind;
};

export function PlaceNameBadge({
  label,
  accentColor,
  backgroundColor,
  textColor,
  borderColor,
  placeKind,
}: Props) {
  const showKind = placeKind != null && placeKind !== 'other';
  const kindIcon = showKind ? PLACE_KIND_META[placeKind].icon : null;

  return (
    <View
      style={[
        styles.bubble,
        { backgroundColor, borderColor },
      ]}
      collapsable={false}
    >
      {kindIcon ? (
        <Ionicons name={kindIcon} size={14} color={accentColor} style={styles.kindIcon} />
      ) : (
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
      )}
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    maxWidth: 188,
    overflow: 'visible',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  kindIcon: {
    flexShrink: 0,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 13,
    flexShrink: 1,
    maxWidth: 150,
  },
});
