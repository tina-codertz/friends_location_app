import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useMapEngine } from '@/components/map/MapEngineContext';
import { MapboxPointAnnotation } from '@/components/map/MapboxPointAnnotation';
import { PlaceNameBadge } from '@/components/map/PlaceNameBadge';
import { Font } from '@/constants/typography';

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
    <View style={styles.wrap}>
      <PlaceNameBadge
        label={props.label}
        accentColor={props.accentColor}
        backgroundColor={props.backgroundColor}
        textColor={props.textColor}
        borderColor={props.borderColor}
      />
      {props.subtitle ? (
        <Text style={[styles.subtitle, { color: props.textColor }]} numberOfLines={1}>
          {props.subtitle}
        </Text>
      ) : null}
    </View>
  );

  if (engine === 'mapbox') {
    return (
      <MapboxPointAnnotation
        id={props.id}
        longitude={props.longitude}
        latitude={props.latitude}
        anchor={{ x: 0.5, y: 1 }}
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

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: 160,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.85,
    maxWidth: 120,
    textAlign: 'center',
  },
});
