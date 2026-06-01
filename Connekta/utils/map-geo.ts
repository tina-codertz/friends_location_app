/** Approximate circle polygon for map overlays (radius in meters). */
export function circlePolygon(
  longitude: number,
  latitude: number,
  radiusMeters: number,
  points = 48
): { type: 'Polygon'; coordinates: [number, number][][] } {
  const R = 6371000;
  const latRad = (latitude * Math.PI) / 180;
  const ring: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const dLat = (dy / R) * (180 / Math.PI);
    const dLng = (dx / (R * Math.cos(latRad))) * (180 / Math.PI);
    ring.push([longitude + dLng, latitude + dLat]);
  }

  return { type: 'Polygon', coordinates: [ring] };
}

/** Offset a coordinate northward so labels sit above markers / area circles. */
export function offsetCoordinateNorth(
  latitude: number,
  longitude: number,
  metersNorth: number
): { latitude: number; longitude: number } {
  const dLat = metersNorth / 111_320;
  return { latitude: latitude + dLat, longitude };
}
