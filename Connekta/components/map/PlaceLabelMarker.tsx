import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Font } from '@/constants/typography';

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

/** Round pill marker with place name (and optional subtitle). */
export function PlaceLabelMarker({
  id,
  latitude,
  longitude,
  label,
  subtitle,
  accentColor,
  backgroundColor,
  textColor,
  borderColor,
}: Props) {
  return (
    <Marker
      identifier={id}
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View style={styles.wrap}>
        <View style={[styles.bubble, { backgroundColor, borderColor }]}>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
          <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: textColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    maxWidth: 140,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 13,
    maxWidth: 100,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.85,
    maxWidth: 120,
    textAlign: 'center',
  },
});
