import React, { useMemo } from 'react';
import { Polyline } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { useMapEngine } from '@/components/map/MapEngineContext';
import type { MapCoordinate } from '@/types/map';

type Props = {
  id?: string;
  coordinates: MapCoordinate[];
  strokeColor: string;
  strokeWidth?: number;
};

export function HistoryRouteLayer({
  id = 'history-route',
  coordinates,
  strokeColor,
  strokeWidth = 4,
}: Props) {
  const engine = useMapEngine();

  const lineShape = useMemo(() => {
    if (coordinates.length < 2) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: coordinates.map((c) => [c.longitude, c.latitude] as [number, number]),
      },
    };
  }, [coordinates]);

  if (coordinates.length < 2) return null;

  if (engine === 'mapbox') {
    const Mapbox = getMapboxModule();
    if (!Mapbox || !lineShape) return null;

    return (
      <Mapbox.ShapeSource id={id} shape={lineShape}>
        <Mapbox.LineLayer
          id={`${id}-line`}
          style={{
            lineColor: strokeColor,
            lineWidth: strokeWidth,
            lineOpacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      </Mapbox.ShapeSource>
    );
  }

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      lineCap="round"
      lineJoin="round"
    />
  );
}
