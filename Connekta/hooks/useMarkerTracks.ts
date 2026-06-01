import { useEffect, useState } from 'react';

/** Keeps custom marker views painting fully on both platforms (avoids half-clipped snapshots). */
export function useMarkerTracks(deps: unknown[]): boolean {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    setTracks(true);
    const timer = setTimeout(() => setTracks(false), 1500);
    return () => clearTimeout(timer);
  }, deps);

  return tracks;
}
