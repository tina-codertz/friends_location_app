import React, { forwardRef, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { Feature } from 'geojson';
import {
  canUseMapbox,
  getMapboxStyleUrl,
  latitudeDeltaToZoom,
  type MapColorMode,
} from '@/utils/maps-config';
import { resolveMapEngine } from '@/utils/map-engine';
import { getMapboxModule } from '@/utils/map-runtime';
import { MapEngineProvider } from '@/components/map/MapEngineContext';
import { GoogleMapView } from '@/components/map/GoogleMapView';
import { LegacyMapView } from '@/components/map/LegacyMapView';
import { isValidMapRegion, type MapRegion } from '@/types/map';
import { getMapProviderPreference } from '@/utils/maps-config';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';

export type ConnektaMapRef = {
  flyTo: (region: MapRegion, durationMs?: number) => void;
};

type Props = {
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  initialRegion?: MapRegion | null;
  showUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onPress?: (coord: { latitude: number; longitude: number }) => void;
  fallbackMessage?: string;
  children?: React.ReactNode;
};

type MapboxInnerProps = Omit<Props, 'initialRegion'> & {
  initialRegion: MapRegion;
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
        scaleBarEnabled
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

function MapRegionPlaceholder({
  message,
  style,
  containerStyle,
  mapBg,
  textColor,
}: {
  message: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  mapBg: string;
  textColor: string;
}) {
  return (
    <View style={[styles.fallback, { backgroundColor: mapBg }, containerStyle, style]}>
      <Text style={[Type.body, { color: textColor, textAlign: 'center', fontFamily: Font.medium }]}>
        {message}
      </Text>
    </View>
  );
}

export const ConnektaMap = forwardRef<ConnektaMapRef, Props>(function ConnektaMap(props, ref) {
  const { colors, mode } = useAppTheme();
  const engine = resolveMapEngine();
  const innerMapRef = useRef<ConnektaMapRef | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (region, durationMs = 500) => {
      innerMapRef.current?.flyTo(region, durationMs);
    },
  }));

  const waitingMessage =
    props.fallbackMessage ?? 'Getting your location…';

  if (!isValidMapRegion(props.initialRegion)) {
    return (
      <MapRegionPlaceholder
        message={waitingMessage}
        style={props.style}
        containerStyle={props.containerStyle}
        mapBg={colors.mapBg}
        textColor={colors.textMuted}
      />
    );
  }

  const region = props.initialRegion;

  if (engine === 'google-maps') {
    return (
      <MapEngineProvider engine="legacy">
        <GoogleMapView
          ref={innerMapRef as Ref<ConnektaMapRef>}
          style={props.style}
          initialRegion={region}
          colorMode={mode}
          showUserLocation={props.showUserLocation}
          scrollEnabled={props.scrollEnabled}
          zoomEnabled={props.zoomEnabled}
          rotateEnabled={props.rotateEnabled}
          onPress={props.onPress}
        >
          {props.children}
        </GoogleMapView>
      </MapEngineProvider>
    );
  }

  if (engine === 'unavailable') {
    const message =
      props.fallbackMessage ??
      (getMapProviderPreference() === 'google'
        ? 'Google Maps is not configured in this build. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to EAS, then rebuild the APK.'
        : 'Mapbox token missing. Add EXPO_PUBLIC_MAPBOX_TOKEN to .env, then restart with: npx expo start -c');
    return (
      <View style={[styles.fallback, { backgroundColor: colors.mapBg }, props.containerStyle, props.style]}>
        <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', fontFamily: Font.medium }]}>
          {message}
        </Text>
      </View>
    );
  }

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
          ref={innerMapRef as Ref<ConnektaMapRef>}
          {...props}
          initialRegion={region}
          colorMode={mode}
          mapBg={colors.mapBg}
        />
      </MapEngineProvider>
    );
  }

  return (
    <MapEngineProvider engine="legacy">
      <LegacyMapView
        ref={innerMapRef as Ref<ConnektaMapRef>}
        style={props.style}
        initialRegion={region}
        colorMode={mode}
        showUserLocation={props.showUserLocation}
        onPress={props.onPress}
      >
        {props.children}
      </LegacyMapView>
    </MapEngineProvider>
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
