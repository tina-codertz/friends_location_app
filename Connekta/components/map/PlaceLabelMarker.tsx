import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { MapboxTextMarker } from '@/components/map/MapboxTextMarker';
import { MapMarkerLabel } from '@/components/map/MapMarkerLabel';
import { offsetCoordinateNorth } from '@/utils/map-geo';

const PIN_LABEL_OFFSET_M = 32;

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
  const { isDark } = useAppTheme();
  const labelCoord = offsetCoordinateNorth(
    props.latitude,
    props.longitude,
    PIN_LABEL_OFFSET_M
  );

  if (engine === 'mapbox') {
    return (
      <MapboxTextMarker
        id={props.id}
        longitude={labelCoord.longitude}
        latitude={labelCoord.latitude}
        label={props.label}
        subtitle={props.subtitle}
        accentHex={props.accentColor}
        isDark={isDark}
      />
    );
  }

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

  return (
    <Marker
      identifier={props.id}
      coordinate={labelCoord}
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: -20 }}
      tracksViewChanges={false}
    >
      {content}
    </Marker>
  );
}

export const PlaceLabelMarker = memo(PlaceLabelMarkerComponent);
