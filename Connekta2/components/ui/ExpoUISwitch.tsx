/**
 * ExpoUISwitch — themed @expo/ui Switch with RN fallback when Expo UI is off.
 */

import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { Switch as ExpoSwitch } from '@expo/ui';
import { useExpoUI } from '@/context/ExpoUIContext';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ExpoUISwitch({ value, onValueChange, disabled }: Props) {
  const { isHosted, disabled: expoDisabled, accent } = useExpoUI();

  if (expoDisabled || !isHosted) {
    return (
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#3a3a3c', true: accent.cyan }}
        thumbColor="#ffffff"
      />
    );
  }

  return <ExpoSwitch value={value} onValueChange={onValueChange} disabled={disabled} />;
}
