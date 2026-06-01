import React, { memo, useMemo } from 'react';
import { Circle, Marker } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { MapboxTextMarker } from '@/components/map/MapboxTextMarker';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useMarkerTracks } from '@/hooks/useMarkerTracks';
import { MapMarkerLabel } from '@/components/map/MapMarkerLabel';
import { circlePolygon, offsetCoordinateNorth } from '@/utils/map-geo';
import { hexToRgba } from '@/utils/map-colors';

/** Visible area radius on map (~1–2 city blocks). */
export const PLACE_AREA_RADIUS_M = 150;

/** Lift label above the area circle so it is not covered by fill layers. */
const AREA_LABEL_OFFSET_M = 58;

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
  const badgeBg = colors.glassBgHeavy;
  const badgeText = colors.textPrimary;
  const subtitleColor = colors.textMuted;

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

  const labelContent = (
    <MapMarkerLabel
      label={label}
      subtitle={subtitle}
      accentColor={accentColor}
      backgroundColor={badgeBg}
      textColor={badgeText}
      borderColor={strokeColor}
      subtitleColor={subtitleColor}
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
        <MapboxTextMarker
          id={`label-${id}`}
          longitude={labelCoord.longitude}
          latitude={labelCoord.latitude}
          label={label}
          subtitle={subtitle}
          accentHex={accentColor}
          isDark={isDark}
          showPin={false}
        />
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
        coordinate={labelCoord}
        anchor={{ x: 0.5, y: 1 }}
        centerOffset={{ x: 0, y: -24 }}
        tracksViewChanges={tracksViewChanges}
        zIndex={10}
      >
        {labelContent}
      </Marker>
    </>
  );
}

export const PlaceAreaMarker = memo(PlaceAreaMarkerComponent);
