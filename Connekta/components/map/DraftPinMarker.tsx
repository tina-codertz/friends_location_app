import React from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { useMapEngine } from '@/components/map/MapEngineContext';

type Props = {
  latitude: number;
  longitude: number;
  color: string;
};

export function DraftPinMarker({ latitude, longitude, color }: Props) {
  const engine = useMapEngine();
  const dot = (
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: '#fff',
      }}
    />
  );

  if (engine === 'mapbox') {
    const Mapbox = getMapboxModule();
    if (!Mapbox) return null;
    return (
      <Mapbox.PointAnnotation id="draft-pin" coordinate={[longitude, latitude]}>
        {dot}
      </Mapbox.PointAnnotation>
    );
  }

  return <Marker coordinate={{ latitude, longitude }}>{dot}</Marker>;
}
