import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { Feature } from 'geojson';
import { canUseMapbox, getMapboxStyleUrl, type MapColorMode } from '@/utils/maps-config';
import { ensureMapboxConfigured } from '@/utils/mapbox-init';
import {
  getMapboxModule,
  isMapboxNativeAvailable,
  shouldUseLegacyMapEngine,
} from '@/utils/map-runtime';
import { MapEngineProvider } from '@/components/map/MapEngineContext';
import { LegacyMapView } from '@/components/map/LegacyMapView';
import type { MapRegion } from '@/types/map';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';

export type ConnektaMapRef = {
  flyTo: (region: MapRegion, durationMs?: number) => void;
};

type Props = {
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  initialRegion: MapRegion;
  showUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onPress?: (coord: { latitude: number; longitude: number }) => void;
  fallbackMessage?: string;
  children?: React.ReactNode;
};

function deltaToZoom(latitudeDelta = 0.04): number {
  return Math.max(4, Math.min(16, Math.log2(360 / latitudeDelta) - 1));
}

type MapboxInnerProps = Props & { colorMode: MapColorMode };

function MapboxMapInner(
  {
    style,
    containerStyle,
    initialRegion,
    colorMode,
    showUserLocation,
    scrollEnabled,
    zoomEnabled,
    rotateEnabled,
    pitchEnabled,
    onPress,
    children,
  }: MapboxInnerProps,
  ref: React.Ref<ConnektaMapRef>
) {
  const Mapbox = getMapboxModule()!;
  const cameraRef = useRef<React.ComponentRef<typeof Mapbox.Camera>>(null);

  const center = useMemo(
    () => [initialRegion.longitude, initialRegion.latitude] as [number, number],
    [initialRegion.longitude, initialRegion.latitude]
  );

  const zoom = useMemo(() => deltaToZoom(initialRegion.latitudeDelta), [initialRegion.latitudeDelta]);

  useImperativeHandle(ref, () => ({
    flyTo: (region: MapRegion, durationMs = 500) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [region.longitude, region.latitude],
        zoomLevel: deltaToZoom(region.latitudeDelta),
        animationDuration: durationMs,
      });
    },
  }));

  return (
    <View style={[styles.fill, containerStyle, style]}>
      <Mapbox.MapView
        style={styles.fill}
        styleURL={getMapboxStyleUrl(colorMode)}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        attributionEnabled
        logoEnabled={false}
        compassEnabled
        onPress={
          onPress
            ? (feature: Feature) => {
                const geom = feature.geometry;
                if (geom.type !== 'Point') return;
                const [lng, lat] = geom.coordinates;
                onPress({ latitude: lat, longitude: lng });
              }
            : undefined
        }
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: zoom,
          }}
        />
        {showUserLocation ? <Mapbox.UserLocation visible showsUserHeadingIndicator /> : null}
        {children}
      </Mapbox.MapView>
    </View>
  );
}

const MapboxMap = forwardRef(MapboxMapInner);

export const ConnektaMap = forwardRef<ConnektaMapRef, Props>(function ConnektaMap(props, ref) {
  const { colors, mode } = useAppTheme();
  const useNativeMapbox = isMapboxNativeAvailable() && ensureMapboxConfigured();
  const useLegacy = shouldUseLegacyMapEngine();

  if (!canUseMapbox()) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.bg }, props.containerStyle, props.style]}>
        <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', fontFamily: Font.medium }]}>
          {props.fallbackMessage ??
            'Mapbox token missing. Add EXPO_PUBLIC_MAPBOX_TOKEN to .env, then restart with: npx expo start -c'}
        </Text>
      </View>
    );
  }

  if (useNativeMapbox) {
    return (
      <MapEngineProvider engine="mapbox">
        <MapboxMap ref={ref} {...props} colorMode={mode} />
      </MapEngineProvider>
    );
  }

  if (useLegacy) {
    return (
      <MapEngineProvider engine="legacy">
        <LegacyMapView
          ref={ref}
          style={props.style}
          initialRegion={props.initialRegion}
          colorMode={mode}
          showUserLocation={props.showUserLocation}
          onPress={props.onPress}
        >
          {props.children}
        </LegacyMapView>
      </MapEngineProvider>
    );
  }

  return (
    <View style={[styles.fallback, { backgroundColor: colors.bg }, props.containerStyle, props.style]}>
      <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', fontFamily: Font.medium }]}>
        Map unavailable. Run a dev build: npx expo run:android
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
