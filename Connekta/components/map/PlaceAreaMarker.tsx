import React, { memo, useMemo } from 'react';
import { Circle } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { circlePolygon } from '@/utils/map-geo';
import { hexToRgba } from '@/utils/map-colors';

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
  accentColor,
  radiusMeters = PLACE_AREA_RADIUS_M,
}: Props) {
  const engine = useMapEngine();
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

  if (engine === 'mapbox') {
    const Mapbox = getMapboxModule();
    if (!Mapbox) return null;

    return (
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
    );
  }

  return (
    <Circle
      center={{ latitude, longitude }}
      radius={radiusMeters}
      fillColor={fillColor}
      strokeColor={strokeColor}
      strokeWidth={3}
      zIndex={5}
    />
  );
}

export const PlaceAreaMarker = memo(PlaceAreaMarkerComponent);
