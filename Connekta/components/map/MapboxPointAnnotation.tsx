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

const PAD_H = 24;
const PAD_TOP = 20;
const PAD_BOTTOM = 8;

/**
 * Native Mapbox annotation with a large transparent host so pill badges are not
 * clipped when snapshotted (common cause of "half visible" labels).
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
  const minHeight = hasSubtitle ? 112 : 80;
  const [box, setBox] = useState({
    width: 240,
    height: minHeight + PAD_TOP + PAD_BOTTOM + 16,
  });

  const refreshSnapshot = useCallback(() => {
    annotationRef.current?.refresh?.();
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => annotationRef.current?.refresh?.(), 80);
    refreshTimer.current = setTimeout(() => annotationRef.current?.refresh?.(), 200);
    refreshTimer.current = setTimeout(() => annotationRef.current?.refresh?.(), 450);
  }, []);

  useEffect(() => {
    refreshSnapshot();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [refreshSnapshot, children]);

  const onLayout = useCallback(
    (w: number, h: number) => {
      const width = Math.max(200, Math.ceil(w) + PAD_H * 2);
      const height = Math.max(minHeight + PAD_TOP + PAD_BOTTOM, Math.ceil(h) + PAD_TOP + PAD_BOTTOM);
      setBox((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
      refreshSnapshot();
    },
    [minHeight, refreshSnapshot]
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
        style={[styles.host, { width: box.width, height: box.height }]}
      >
        <View
          collapsable={false}
          style={styles.inner}
          onLayout={(e) =>
            onLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)
          }
        >
          {children}
        </View>
      </View>
    </Mapbox.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: PAD_TOP,
    paddingBottom: PAD_BOTTOM,
    paddingHorizontal: PAD_H,
    overflow: 'visible',
  },
});
