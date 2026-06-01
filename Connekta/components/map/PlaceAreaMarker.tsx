import React, { memo, useMemo } from 'react';
import { Circle } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { MapPillMarker } from '@/components/map/MapPillMarker';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { circlePolygon, offsetCoordinateNorth } from '@/utils/map-geo';
import { hexToRgba } from '@/utils/map-colors';
import type { PlaceKind } from '@/types/places';

/** Visible area radius on map (~1–2 city blocks). */
export const PLACE_AREA_RADIUS_M = 150;

/** Label north of the filled circle so it is not covered by the area layer. */
const AREA_LABEL_OFFSET_M = 72;

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  placeKind?: PlaceKind;
  accentColor: string;
  radiusMeters?: number;
};

function PlaceAreaMarkerComponent({
  id,
  latitude,
  longitude,
  label,
  subtitle,
  placeKind,
  accentColor,
  radiusMeters = PLACE_AREA_RADIUS_M,
}: Props) {
  const engine = useMapEngine();
  const { colors } = useAppTheme();

  const fillColor = useMemo(() => hexToRgba(accentColor, 0.38), [accentColor]);
  const strokeColor = accentColor;

  const labelCoord = useMemo(
    () => offsetCoordinateNorth(latitude, longitude, AREA_LABEL_OFFSET_M),
    [latitude, longitude]
  );

  const areaShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: circlePolygon(longitude, latitude, radiusMeters),
    }),
    [longitude, latitude, radiusMeters]
  );

  const pill = (
    <MapPillMarker
      id={`label-${id}`}
      latitude={labelCoord.latitude}
      longitude={labelCoord.longitude}
      label={label}
      subtitle={subtitle}
      placeKind={placeKind}
      accentColor={accentColor}
      backgroundColor={colors.glassBgHeavy}
      textColor={colors.textPrimary}
      borderColor={strokeColor}
      subtitleColor={colors.textMuted}
    />
  );

  if (engine === 'mapbox') {
    const Mapbox = getMapboxModule();
    if (!Mapbox) return pill;

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
        {pill}
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
      {pill}
    </>
  );
}

export const PlaceAreaMarker = memo(PlaceAreaMarkerComponent);
