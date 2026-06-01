import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { MapboxPointAnnotation } from '@/components/map/MapboxPointAnnotation';
import { MapMarkerLabel } from '@/components/map/MapMarkerLabel';
import { useMarkerTracks } from '@/hooks/useMarkerTracks';
import type { PlaceKind } from '@/types/places';

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  placeKind?: PlaceKind;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  subtitleColor?: string;
};

const LEGACY_W = 240;
const LEGACY_H_NO_SUB = 96;
const LEGACY_H_SUB = 128;
const LEGACY_KIND_EXTRA = 28;

/**
 * Full glass pill on map — Mapbox PointAnnotation (dev build) or legacy Marker (Expo Go).
 */
function MapPillMarkerComponent({
  id,
  latitude,
  longitude,
  label,
  subtitle,
  placeKind,
  accentColor,
  backgroundColor,
  textColor,
  borderColor,
  subtitleColor,
}: Props) {
  const engine = useMapEngine();
  const hasSubtitle = Boolean(subtitle?.trim());
  const hasKindChip = placeKind != null && placeKind !== 'other';
  const tracksViewChanges = useMarkerTracks([
    label,
    subtitle,
    placeKind,
    accentColor,
    backgroundColor,
    textColor,
    borderColor,
    subtitleColor,
  ]);

  const content = (
    <MapMarkerLabel
      label={label}
      subtitle={subtitle}
      placeKind={placeKind}
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      textColor={textColor}
      borderColor={borderColor}
      subtitleColor={subtitleColor}
    />
  );

  if (engine === 'mapbox') {
    return (
      <MapboxPointAnnotation
        id={id}
        longitude={longitude}
        latitude={latitude}
        anchor={{ x: 0.5, y: 1 }}
        hasSubtitle={hasSubtitle}
        hasKindChip={hasKindChip}
      >
        {content}
      </MapboxPointAnnotation>
    );
  }

  const legacyHeight =
    (hasSubtitle ? LEGACY_H_SUB : LEGACY_H_NO_SUB) + (hasKindChip ? LEGACY_KIND_EXTRA : 0);

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={10}
    >
      <View
        collapsable={false}
        style={[styles.legacyHost, { width: LEGACY_W, height: legacyHeight }]}
      >
        {content}
      </View>
    </Marker>
  );
}

export const MapPillMarker = memo(MapPillMarkerComponent);

const styles = StyleSheet.create({
  legacyHost: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
});
