import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { canUseMapbox, MAPBOX_STYLE_URL } from '@/utils/maps-config';
import { ensureMapboxConfigured } from '@/utils/mapbox-init';
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

export const ConnektaMap = forwardRef<ConnektaMapRef, Props>(function ConnektaMap(
  {
    style,
    containerStyle,
    initialRegion,
    showUserLocation = true,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = false,
    pitchEnabled = false,
    onPress,
    fallbackMessage,
    children,
  },
  ref
) {
  const { colors } = useAppTheme();
  const cameraRef = useRef<Mapbox.Camera>(null);

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

  if (!canUseMapbox() || !ensureMapboxConfigured()) {
    return (
      <View style={[styles.fallback, containerStyle, style]}>
        <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', fontFamily: Font.medium }]}>
          {fallbackMessage ??
            'Add EXPO_PUBLIC_MAPBOX_TOKEN to .env, then rebuild the app (expo prebuild / EAS build).'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.fill, containerStyle, style]}>
      <Mapbox.MapView
        style={styles.fill}
        styleURL={MAPBOX_STYLE_URL}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        attributionEnabled
        logoEnabled={false}
        compassEnabled
        onPress={
          onPress
            ? (e) => {
                const [lng, lat] = e.geometry.coordinates;
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
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
});
