import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlaceNameBadge } from '@/components/map/PlaceNameBadge';
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
 * Single pill label + optional subtitle + pin tip at bottom (anchor on map).
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
  return (
    <View style={styles.wrap} collapsable={false}>
      <PlaceNameBadge
        label={label}
        placeKind={placeKind}
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
