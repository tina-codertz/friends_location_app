import React, { createContext, useContext } from 'react';

export type MapEngine = 'mapbox' | 'legacy';

const MapEngineContext = createContext<MapEngine>('legacy');

export function MapEngineProvider({
  engine,
  children,
}: {
  engine: MapEngine;
  children: React.ReactNode;
}) {
  return <MapEngineContext.Provider value={engine}>{children}</MapEngineContext.Provider>;
}

export function useMapEngine(): MapEngine {
  return useContext(MapEngineContext);
}
