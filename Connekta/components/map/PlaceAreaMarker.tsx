import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getMapboxModule } from '@/utils/map-runtime';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useMarkerTracks } from '@/hooks/useMarkerTracks';
import { circlePolygon } from '@/utils/map-geo';
import { hexToRgba } from '@/utils/map-colors';
import { Font } from '@/constants/typography';

/** Visible area radius on map (~1–2 city blocks). */
export const PLACE_AREA_RADIUS_M = 150;

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  accentColor: string;
  radiusMeters?: number;
};

function PlaceAreaMarkerComponent({
  id,
  latitude,
  longitude,
  label,
  subtitle,
  accentColor,
  radiusMeters = PLACE_AREA_RADIUS_M,
}: Props) {
  const engine = useMapEngine();
  const { colors, isDark } = useAppTheme();
  const tracksViewChanges = useMarkerTracks([label, subtitle, accentColor, isDark]);

  const fillColor = useMemo(() => hexToRgba(accentColor, 0.38), [accentColor]);
  const strokeColor = accentColor;

  const areaShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: circlePolygon(longitude, latitude, radiusMeters),
    }),
    [longitude, latitude, radiusMeters]
  );

  const centerPin = (
    <View style={styles.centerWrap} collapsable={false}>
      <View style={[styles.pinOuter, { borderColor: '#fff', backgroundColor: accentColor }]}>
        <Ionicons name="location" size={22} color="#fff" />
      </View>
      <View
        style={[
          styles.labelCard,
          {
            borderColor: strokeColor,
            backgroundColor: isDark ? colors.bgCard : '#fff',
            shadowColor: '#000',
          },
        ]}
      >
        <Text
          style={[styles.labelText, { color: isDark ? colors.textPrimary : '#111' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitleText, { color: isDark ? colors.textMuted : '#555' }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (engine === 'mapbox') {
    const Mapbox = getMapboxModule();
    if (!Mapbox) return null;

    return (
      <>
        <Mapbox.ShapeSource id={`area-${id}`} shape={areaShape}>
          <Mapbox.FillLayer
            id={`area-fill-${id}`}
            style={{ fillColor: accentColor, fillOpacity: 0.38 }}
          />
          <Mapbox.LineLayer
            id={`area-line-${id}`}
            style={{ lineColor: strokeColor, lineWidth: 3.5 }}
          />
        </Mapbox.ShapeSource>
        <Mapbox.PointAnnotation
          id={`pin-${id}`}
          coordinate={[longitude, latitude]}
          anchor={{ x: 0.5, y: 1 }}
        >
          {centerPin}
        </Mapbox.PointAnnotation>
      </>
    );
  }

  return (
    <>
      <Circle
        center={{ latitude, longitude }}
        radius={radiusMeters}
        fillColor={fillColor}
        strokeColor={strokeColor}
        strokeWidth={3}
        zIndex={5}
      />
      <Marker
        identifier={`pin-${id}`}
        coordinate={{ latitude, longitude }}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={tracksViewChanges}
        zIndex={10}
      >
        {centerPin}
      </Marker>
    </>
  );
}

export const PlaceAreaMarker = memo(PlaceAreaMarkerComponent);

const styles = StyleSheet.create({
  centerWrap: {
    alignItems: 'center',
    maxWidth: 180,
  },
  pinOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  labelCard: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2.5,
    maxWidth: 180,
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  labelText: {
    fontFamily: Font.bold,
    fontSize: 14,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: Font.medium,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
