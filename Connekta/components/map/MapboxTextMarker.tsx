import React, { useMemo } from 'react';
import { getMapboxModule } from '@/utils/map-runtime';

type Props = {
  id: string;
  longitude: number;
  latitude: number;
  label: string;
  subtitle?: string;
  accentHex: string;
  isDark: boolean;
  /** Pin dot at coordinate — disable when a circle/area already marks the spot */
  showPin?: boolean;
};

function stripHash(hex: string): string {
  return hex.replace(/^#/, '');
}

/**
 * Native Mapbox symbol layers — avoids PointAnnotation bitmap clipping (half badges).
 */
export function MapboxTextMarker({
  id,
  longitude,
  latitude,
  label,
  subtitle,
  accentHex,
  isDark,
  showPin = true,
}: Props) {
  const Mapbox = getMapboxModule();

  const title = subtitle ? `${label}\n${subtitle}` : label;

  const shape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: { title },
      geometry: {
        type: 'Point' as const,
        coordinates: [longitude, latitude],
      },
    }),
    [longitude, latitude, title]
  );

  const textColor = isDark ? '#E4E1E6' : '#111111';
  const haloColor = isDark ? '#131316' : '#FFFFFF';
  const accent = stripHash(accentHex);

  if (!Mapbox) return null;

  const textOffset: [number, number] = showPin ? [0, -2.2] : [0, 0];
  const textAnchor = showPin ? 'bottom' : 'center';

  return (
    <Mapbox.ShapeSource id={`text-src-${id}`} shape={shape}>
      {showPin ? (
        <Mapbox.CircleLayer
          id={`text-pin-${id}`}
          style={{
            circleRadius: 5,
            circleColor: `#${accent}`,
            circleStrokeWidth: 2,
            circleStrokeColor: haloColor,
          }}
        />
      ) : null}
      <Mapbox.SymbolLayer
        id={`text-label-${id}`}
        style={{
          textField: ['get', 'title'],
          textSize: 12,
          textLineHeight: 1.3,
          textFont: ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          textColor,
          textHaloColor: haloColor,
          textHaloWidth: 2.5,
          textAnchor,
          textOffset,
          textAllowOverlap: true,
          iconAllowOverlap: true,
          textPadding: 4,
        }}
      />
    </Mapbox.ShapeSource>
  );
}
