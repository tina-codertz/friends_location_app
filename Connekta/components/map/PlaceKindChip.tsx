import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaceKind } from '@/types/places';
import { PLACE_KIND_META } from '@/utils/place-kind';
import { Font } from '@/constants/typography';

type Props = {
  kind: PlaceKind;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
};

/** Small category badge above the place name pill (Home, Office, …). */
export function PlaceKindChip({
  kind,
  accentColor,
  textColor,
  backgroundColor,
  borderColor,
}: Props) {
  const meta = PLACE_KIND_META[kind];

  return (
    <View
      collapsable={false}
      style={[
        styles.chip,
        { backgroundColor, borderColor },
      ]}
    >
      <Ionicons name={meta.icon} size={11} color={accentColor} />
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {meta.shortLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: 6,
    overflow: 'visible',
  },
  text: {
    fontFamily: Font.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
});
