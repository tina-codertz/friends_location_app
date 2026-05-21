import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { getMapboxModule } from '@/utils/map-runtime';
import { useMapEngine } from '@/components/map/MapEngineContext';
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
    const Mapbox = getMapboxModule();
    if (!Mapbox) return null;
    return (
      <Mapbox.PointAnnotation
        id={props.id}
        coordinate={[props.longitude, props.latitude]}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        {content}
      </Mapbox.PointAnnotation>
    );
  }

  return (
    <Marker
      identifier={props.id}
      coordinate={{ latitude: props.latitude, longitude: props.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
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
    maxWidth: 140,
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
