import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { Feature } from 'geojson';
import {
  canUseMapbox,
  getMapboxStyleUrl,
  latitudeDeltaToZoom,
  type MapColorMode,
} from '@/utils/maps-config';
import { resolveMapEngine, mapEngineLabel } from '@/utils/map-engine';
import { getMapboxModule } from '@/utils/map-runtime';
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

type MapboxInnerProps = Props & {
  colorMode: MapColorMode;
  mapBg: string;
};

function MapboxMapInner(
  {
    style,
    containerStyle,
    initialRegion,
    colorMode,
    mapBg,
    showUserLocation,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = false,
    pitchEnabled = false,
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

  const zoom = useMemo(
    () => latitudeDeltaToZoom(initialRegion.latitudeDelta),
    [initialRegion.latitudeDelta]
  );

  const styleURL = useMemo(() => getMapboxStyleUrl(colorMode), [colorMode]);

  useImperativeHandle(ref, () => ({
    flyTo: (region: MapRegion, durationMs = 500) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [region.longitude, region.latitude],
        zoomLevel: latitudeDeltaToZoom(region.latitudeDelta),
        animationDuration: durationMs,
        pitch: 0,
        heading: 0,
      });
    },
  }));

  return (
    <View style={[styles.fill, { backgroundColor: mapBg }, containerStyle, style]}>
      <Mapbox.MapView
        style={[styles.fill, { backgroundColor: mapBg }]}
        styleURL={styleURL}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        attributionEnabled
        logoEnabled={false}
        compassEnabled
        scaleBarEnabled={false}
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
            pitch: 0,
            heading: 0,
          }}
        />
        {showUserLocation ? (
          <Mapbox.UserLocation
            visible
            showsUserHeadingIndicator
            androidRenderMode="compass"
            minDisplacement={5}
          />
        ) : null}
        {children}
      </Mapbox.MapView>
    </View>
  );
}

const MapboxMap = forwardRef(MapboxMapInner);

export const ConnektaMap = forwardRef<ConnektaMapRef, Props>(function ConnektaMap(props, ref) {
  const { colors, accent, mode } = useAppTheme();
  const engine = resolveMapEngine();

  if (!canUseMapbox()) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.mapBg }, props.containerStyle, props.style]}>
        <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', fontFamily: Font.medium }]}>
          {props.fallbackMessage ??
            'Mapbox token missing. Add EXPO_PUBLIC_MAPBOX_TOKEN to .env, then restart with: npx expo start -c'}
        </Text>
      </View>
    );
  }

  if (engine === 'mapbox-gl') {
    return (
      <MapEngineProvider engine="mapbox">
        <MapboxMap
          ref={ref}
          {...props}
          colorMode={mode}
          mapBg={colors.mapBg}
        />
      </MapEngineProvider>
    );
  }

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
});

export function getActiveMapEngineLabel(): string {
  return mapEngineLabel(resolveMapEngine());
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
