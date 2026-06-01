import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { MapboxPointAnnotation } from '@/components/map/MapboxPointAnnotation';
import { MapMarkerLabel } from '@/components/map/MapMarkerLabel';

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

function PlaceLabelMarkerComponent(props: Props) {
  const engine = useMapEngine();
  const content = (
    <MapMarkerLabel
      label={props.label}
      subtitle={props.subtitle}
      accentColor={props.accentColor}
      backgroundColor={props.backgroundColor}
      textColor={props.textColor}
      borderColor={props.borderColor}
      subtitleColor={props.textColor}
    />
  );

  if (engine === 'mapbox') {
    return (
      <MapboxPointAnnotation
        id={props.id}
        longitude={props.longitude}
        latitude={props.latitude}
        anchor={{ x: 0.5, y: 1 }}
        hasSubtitle={Boolean(props.subtitle)}
      >
        {content}
      </MapboxPointAnnotation>
    );
  }

  return (
    <Marker
      identifier={props.id}
      coordinate={{ latitude: props.latitude, longitude: props.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      {content}
    </Marker>
  );
}

export const PlaceLabelMarker = memo(PlaceLabelMarkerComponent);
