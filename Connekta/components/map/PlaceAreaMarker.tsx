import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { circlePolygon } from '@/utils/map-geo';
import { hexToRgba } from '@/utils/map-colors';
import { Font } from '@/constants/typography';

/** Default radius shown on map (~city block). */
export const PLACE_AREA_RADIUS_M = 120;

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
  const fillColor = useMemo(() => hexToRgba(accentColor, 0.28), [accentColor]);
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
    <View style={styles.centerWrap}>
      <View style={[styles.pinOuter, { borderColor: '#fff', backgroundColor: accentColor }]}>
        <View style={styles.pinInner} />
      </View>
      <View style={[styles.labelCard, { borderColor: strokeColor, backgroundColor: '#fff' }]}>
        <Text style={styles.labelText} numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitleText} numberOfLines={1}>
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
            style={{ fillColor: accentColor, fillOpacity: 0.28 }}
          />
          <Mapbox.LineLayer
            id={`area-line-${id}`}
            style={{ lineColor: strokeColor, lineWidth: 2.5 }}
          />
        </Mapbox.ShapeSource>
        <Mapbox.PointAnnotation
          id={`pin-${id}`}
          coordinate={[longitude, latitude]}
          anchor={{ x: 0.5, y: 0.5 }}
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
        strokeWidth={2.5}
        zIndex={1}
      />
      <Marker
        identifier={`pin-${id}`}
        coordinate={{ latitude, longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
        zIndex={2}
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
    maxWidth: 160,
  },
  pinOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pinInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  labelCard: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    maxWidth: 160,
    elevation: 6,
  },
  labelText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#111',
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: Font.regular,
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
  },
});
