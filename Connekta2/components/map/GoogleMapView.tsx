import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { GOOGLE_MAP_DARK_STYLE } from '@/utils/google-map-styles';
import { MAP_ZOOM, type MapColorMode } from '@/utils/maps-config';
import { useAppTheme } from '@/context/ThemeContext';
import type { MapRegion } from '@/types/map';
import type { ConnektaMapRef } from '@/components/map/ConnektaMap';

type Props = {
  style?: StyleProp<ViewStyle>;
  initialRegion: MapRegion;
  colorMode: MapColorMode;
  showUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  onPress?: (coord: { latitude: number; longitude: number }) => void;
  children?: React.ReactNode;
};

/**
 * Google Maps base map — rich POIs and street labels (good for unfamiliar areas).
 * Requires native rebuild + Maps SDK API keys (see maps-config).
 */
export const GoogleMapView = forwardRef<ConnektaMapRef, Props>(function GoogleMapView(
  {
    style,
    initialRegion,
    colorMode,
    showUserLocation = true,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = false,
    onPress,
    children,
  },
  ref
) {
  const { colors, accent } = useAppTheme();
  const mapRef = useRef<MapView>(null);

  const region: Region = {
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta ?? MAP_ZOOM.defaultLatitudeDelta,
    longitudeDelta: initialRegion.longitudeDelta ?? MAP_ZOOM.defaultLatitudeDelta,
  };

  useImperativeHandle(ref, () => ({
    flyTo: (r: MapRegion, durationMs = 500) => {
      mapRef.current?.animateToRegion(
        {
          latitude: r.latitude,
          longitude: r.longitude,
          latitudeDelta: r.latitudeDelta ?? MAP_ZOOM.defaultLatitudeDelta,
          longitudeDelta: r.longitudeDelta ?? MAP_ZOOM.defaultLatitudeDelta,
        },
        durationMs
      );
    },
  }));

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={[styles.fill, { backgroundColor: colors.mapBg }, style]}
      initialRegion={region}
      mapType="standard"
      customMapStyle={colorMode === 'dark' ? [...GOOGLE_MAP_DARK_STYLE] : undefined}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={Platform.OS === 'android'}
      showsCompass
      showsScale
      showsPointsOfInterests
      showsBuildings
      showsTraffic={false}
      loadingBackgroundColor={colors.mapBg}
      loadingIndicatorColor={accent.cyan}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      rotateEnabled={rotateEnabled}
      pitchEnabled={false}
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
      {children}
    </MapView>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
