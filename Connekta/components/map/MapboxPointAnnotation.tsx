import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { getMapboxModule } from '@/utils/map-runtime';

type Anchor = { x: number; y: number };

type Props = {
  id: string;
  longitude: number;
  latitude: number;
  anchor?: Anchor;
  hasSubtitle?: boolean;
  children: React.ReactNode;
};

/** Fallback for small pins (draft) — fixed size + layout-driven refresh. */
export function MapboxPointAnnotation({
  id,
  longitude,
  latitude,
  anchor = { x: 0.5, y: 0.5 },
  hasSubtitle = false,
  children,
}: Props) {
  const Mapbox = getMapboxModule();
  const annotationRef = useRef<{ refresh?: () => void } | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [box, setBox] = useState({
    width: hasSubtitle ? 200 : 180,
    height: hasSubtitle ? 88 : 56,
  });

  const refreshSnapshot = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    annotationRef.current?.refresh?.();
    refreshTimer.current = setTimeout(() => annotationRef.current?.refresh?.(), 100);
    refreshTimer.current = setTimeout(() => annotationRef.current?.refresh?.(), 250);
  }, []);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    []
  );

  const onLayout = useCallback(
    (w: number, h: number) => {
      const width = Math.max(120, Math.ceil(w) + 32);
      const height = Math.max(44, Math.ceil(h) + 32);
      setBox((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
      refreshSnapshot();
    },
    [refreshSnapshot]
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
        style={[
          styles.host,
          { width: box.width, height: box.height },
        ]}
        onLayout={(e) => onLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
      >
        <View collapsable={false} style={styles.inner}>
          {children}
        </View>
      </View>
    </Mapbox.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
