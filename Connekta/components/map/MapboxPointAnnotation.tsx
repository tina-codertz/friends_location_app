import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { getMapboxModule } from '@/utils/map-runtime';

type Anchor = { x: number; y: number };

type Props = {
  id: string;
  longitude: number;
  latitude: number;
  anchor?: Anchor;
  children: React.ReactNode;
};

/**
 * Mapbox snapshots one direct child for PointAnnotation. Wrapper prevents
 * RN view flattening and layout clipping (badges appearing cut in half).
 */
export function MapboxPointAnnotation({
  id,
  longitude,
  latitude,
  anchor = { x: 0.5, y: 0.5 },
  children,
}: Props) {
  const Mapbox = getMapboxModule();
  const annotationRef = useRef<{ refresh?: () => void } | null>(null);

  const refreshSnapshot = useCallback(() => {
    annotationRef.current?.refresh?.();
  }, []);

  if (!Mapbox) return null;

  return (
    <Mapbox.PointAnnotation
      ref={annotationRef as React.RefObject<never>}
      id={id}
      coordinate={[longitude, latitude]}
      anchor={anchor}
    >
      <View collapsable={false} style={styles.host} onLayout={refreshSnapshot}>
        {children}
      </View>
    </Mapbox.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    minWidth: 140,
    minHeight: 52,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
});
