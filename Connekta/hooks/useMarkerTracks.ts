import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** Custom map markers on Android often need a short tracksViewChanges window to paint. */
export function useMarkerTracks(deps: unknown[]): boolean {
  const [tracks, setTracks] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setTracks(true);
    const timer = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(timer);
  }, deps);

  return Platform.OS === 'android' ? tracks : false;
}
