import React, { memo, useMemo } from 'react';
import { Circle, Marker } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { MapboxPointAnnotation } from '@/components/map/MapboxPointAnnotation';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useMarkerTracks } from '@/hooks/useMarkerTracks';
import { PlaceNameBadge } from '@/components/map/PlaceNameBadge';
import { circlePolygon } from '@/utils/map-geo';
import { hexToRgba } from '@/utils/map-colors';

/** Visible area radius on map (~1–2 city blocks). */
export const PLACE_AREA_RADIUS_M = 150;

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  accentColor: string;
  radiusMeters?: number;
};

function PlaceAreaMarkerComponent({
  id,
  latitude,
  longitude,
  label,
  accentColor,
  radiusMeters = PLACE_AREA_RADIUS_M,
}: Props) {
  const engine = useMapEngine();
  const { colors, isDark } = useAppTheme();
  const tracksViewChanges = useMarkerTracks([label, accentColor, isDark]);

  const fillColor = useMemo(() => hexToRgba(accentColor, 0.38), [accentColor]);
  const strokeColor = accentColor;
  const badgeBg = isDark ? colors.bgCard : '#fff';
  const badgeText = isDark ? colors.textPrimary : '#111';

  const areaShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: circlePolygon(longitude, latitude, radiusMeters),
    }),
    [longitude, latitude, radiusMeters]
  );

  const nameBadge = (
    <PlaceNameBadge
      label={label}
      accentColor={accentColor}
      backgroundColor={badgeBg}
      textColor={badgeText}
      borderColor={strokeColor}
    />
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
        <MapboxPointAnnotation
          id={`label-${id}`}
          longitude={longitude}
          latitude={latitude}
          anchor={{ x: 0.5, y: 1 }}
        >
          {nameBadge}
        </MapboxPointAnnotation>
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
        identifier={`label-${id}`}
        coordinate={{ latitude, longitude }}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={tracksViewChanges}
        zIndex={10}
      >
        {nameBadge}
      </Marker>
    </>
  );
}

export const PlaceAreaMarker = memo(PlaceAreaMarkerComponent);
