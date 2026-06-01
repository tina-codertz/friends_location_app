import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlaceNameBadge } from '@/components/map/PlaceNameBadge';
import { PlaceKindChip } from '@/components/map/PlaceKindChip';
import type { PlaceKind } from '@/types/places';
import { Font } from '@/constants/typography';

type Props = {
  label: string;
  subtitle?: string;
  placeKind?: PlaceKind;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  subtitleColor?: string;
};

/**
 * Pill label + optional subtitle + pin tip at bottom (anchor point on map).
 * Layout is bottom-anchored so the full badge sits above the coordinate.
 */
export function MapMarkerLabel({
  label,
  subtitle,
  placeKind,
  accentColor,
  backgroundColor,
  textColor,
  borderColor,
  subtitleColor,
}: Props) {
  const showKind = placeKind != null && placeKind !== 'other';

  return (
    <View style={styles.wrap} collapsable={false}>
      {showKind ? (
        <PlaceKindChip
          kind={placeKind}
          accentColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
        />
      ) : null}
      <PlaceNameBadge
        label={label}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
        borderColor={borderColor}
      />
      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: subtitleColor ?? textColor }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      ) : null}
      <View style={[styles.pin, { backgroundColor: accentColor, borderColor: backgroundColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    maxWidth: 200,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: 10,
    marginTop: 4,
    maxWidth: 188,
    textAlign: 'center',
    lineHeight: 14,
  },
  pin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    borderWidth: 2,
  },
});
