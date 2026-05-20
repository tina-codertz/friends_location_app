import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
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

/** Round pill marker with name — Mapbox PointAnnotation */
function PlaceLabelMarkerComponent({
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
    <Mapbox.PointAnnotation id={id} coordinate={[longitude, latitude]} anchor={{ x: 0.5, y: 0.5 }}>
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
    </Mapbox.PointAnnotation>
  );
}

export const PlaceLabelMarker = memo(PlaceLabelMarkerComponent);

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
