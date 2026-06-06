export type ShareMode = 'exact' | 'bubble' | 'paused';

/** Approximate grid size for bubble / area sharing. */
export const BUBBLE_GRID_METERS = 500;

export function bubbleCoordinate(
  latitude: number,
  longitude: number,
  gridMeters = BUBBLE_GRID_METERS,
): { lat: number; lng: number } {
  const latStep = gridMeters / 111_320;
  const lngStep = gridMeters / (111_320 * Math.cos((latitude * Math.PI) / 180));
  const latCell = Math.floor(latitude / latStep);
  const lngCell = Math.floor(longitude / lngStep);
  return {
    lat: (latCell + 0.5) * latStep,
    lng: (lngCell + 0.5) * lngStep,
  };
}

export function coordinatesForShareMode(
  latitude: number,
  longitude: number,
  mode: ShareMode,
): { lat: number; lng: number } {
  if (mode === 'bubble') return bubbleCoordinate(latitude, longitude);
  return { lat: latitude, lng: longitude };
}

export function shareModeLabel(mode: ShareMode): string {
  switch (mode) {
    case 'exact':
      return 'Exact location';
    case 'bubble':
      return 'Approximate area';
    case 'paused':
      return 'Paused';
    default:
      return mode;
  }
}

export function shareModeDescription(mode: ShareMode): string {
  switch (mode) {
    case 'exact':
      return 'Circle members see your precise position while sharing is on.';
    case 'bubble':
      return 'Circle members see an approximate area (~500m), not your exact pin.';
    case 'paused':
      return 'Location is hidden from your circle until you share again.';
    default:
      return '';
  }
}
