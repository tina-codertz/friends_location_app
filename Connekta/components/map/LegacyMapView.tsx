import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { UrlTile, type Region } from 'react-native-maps';
import { getMapboxAccessToken, getMapboxRasterStyleId, type MapColorMode } from '@/utils/maps-config';
import type { MapRegion } from '@/types/map';
import type { ConnektaMapRef } from '@/components/map/ConnektaMap';

type Props = {
  style?: StyleProp<ViewStyle>;
  initialRegion: MapRegion;
  colorMode?: MapColorMode;
  showUserLocation?: boolean;
  onPress?: (coord: { latitude: number; longitude: number }) => void;
  children?: React.ReactNode;
};

/** Expo Go / dev fallback using react-native-maps + optional Mapbox raster tiles. */
export const LegacyMapView = forwardRef<ConnektaMapRef, Props>(function LegacyMapView(
  { style, initialRegion, colorMode = 'light', showUserLocation = true, onPress, children },
  ref
) {
  const mapRef = useRef<MapView>(null);
  const token = getMapboxAccessToken();
  const rasterStyle = getMapboxRasterStyleId(colorMode);
  const mapTypeProps = Platform.OS === 'ios' ? { mapType: 'standard' as const } : {};

  const region: Region = {
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta ?? 0.04,
    longitudeDelta: initialRegion.longitudeDelta ?? 0.04,
  };

  useImperativeHandle(ref, () => ({
    flyTo: (r: MapRegion, durationMs = 500) => {
      mapRef.current?.animateToRegion(
        {
          latitude: r.latitude,
          longitude: r.longitude,
          latitudeDelta: r.latitudeDelta ?? 0.04,
          longitudeDelta: r.longitudeDelta ?? 0.04,
        },
        durationMs
      );
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={[styles.fill, style]}
      initialRegion={region}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={Platform.OS === 'android'}
      {...mapTypeProps}
      onPress={
        onPress
          ? (e) => {
              onPress({
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
              });
            }
          : undefined
      }
    >
      {token ? (
        <UrlTile
          urlTemplate={`https://api.mapbox.com/styles/v1/mapbox/${rasterStyle}/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`}
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />
      ) : null}
      {children}
    </MapView>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
