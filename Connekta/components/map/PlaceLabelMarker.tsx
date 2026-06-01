import React, { memo } from 'react';
import { MapPillMarker } from '@/components/map/MapPillMarker';
import { offsetCoordinateNorth } from '@/utils/map-geo';

/** Lift pin above the point so the pill clears friend / place dots. */
const LABEL_OFFSET_M = 28;

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

function PlaceLabelMarkerComponent(props: Props) {
  const labelCoord = offsetCoordinateNorth(
    props.latitude,
    props.longitude,
    LABEL_OFFSET_M
  );

  return (
    <MapPillMarker
      id={props.id}
      latitude={labelCoord.latitude}
      longitude={labelCoord.longitude}
      label={props.label}
      subtitle={props.subtitle}
      accentColor={props.accentColor}
      backgroundColor={props.backgroundColor}
      textColor={props.textColor}
      borderColor={props.borderColor}
      subtitleColor={props.textColor}
    />
  );
}

export const PlaceLabelMarker = memo(PlaceLabelMarkerComponent);
