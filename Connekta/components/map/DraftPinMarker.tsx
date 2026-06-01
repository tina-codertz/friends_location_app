import React from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { MapboxPointAnnotation } from '@/components/map/MapboxPointAnnotation';
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
      collapsable={false}
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
    return (
      <MapboxPointAnnotation
        id="draft-pin"
        longitude={longitude}
        latitude={latitude}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        {dot}
      </MapboxPointAnnotation>
    );
  }

  return <Marker coordinate={{ latitude, longitude }}>{dot}</Marker>;
}
