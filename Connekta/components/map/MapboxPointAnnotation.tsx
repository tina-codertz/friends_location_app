import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { getMapboxModule } from '@/utils/map-runtime';

type Anchor = { x: number; y: number };

type Props = {
  id: string;
  longitude: number;
  latitude: number;
  anchor?: Anchor;
  /** Taller snapshot box when subtitle is shown */
  hasSubtitle?: boolean;
  children: React.ReactNode;
};

/**
 * Mapbox PointAnnotation renders children to a bitmap — one stable wrapper
 * with collapsable={false} and explicit size prevents clipped badges.
 */
export function MapboxPointAnnotation({
  id,
  longitude,
  latitude,
  anchor = { x: 0.5, y: 1 },
  hasSubtitle = false,
  children,
}: Props) {
  const Mapbox = getMapboxModule();
  const annotationRef = useRef<{ refresh?: () => void } | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSnapshot = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    annotationRef.current?.refresh?.();
    refreshTimer.current = setTimeout(() => {
      annotationRef.current?.refresh?.();
    }, 80);
  }, []);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    []
  );

  if (!Mapbox) return null;

  return (
    <Mapbox.PointAnnotation
      ref={annotationRef as React.RefObject<never>}
      id={id}
      coordinate={[longitude, latitude]}
      anchor={anchor}
    >
      <View
        collapsable={false}
        style={[styles.host, hasSubtitle && styles.hostTall]}
        onLayout={refreshSnapshot}
      >
        {children}
      </View>
    </Mapbox.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    minWidth: 148,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  hostTall: {
    minHeight: 72,
    paddingBottom: 10,
  },
});
