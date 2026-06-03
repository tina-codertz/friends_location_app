export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
};

export function isValidMapRegion(region: MapRegion | null | undefined): region is MapRegion {
  return (
    region != null &&
    Number.isFinite(region.latitude) &&
    Number.isFinite(region.longitude) &&
    region.latitude >= -90 &&
    region.latitude <= 90 &&
    region.longitude >= -180 &&
    region.longitude <= 180
  );
}

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};
