/**
 * Haptic Tab Button Component
 */

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticTabProps {
  onPress?: (event: any) => void;
  children?: React.ReactNode;
  [key: string]: any;
}

export const HapticTab: React.FC<HapticTabProps> = ({
  onPress,
  children,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={(...args) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(...args);
      }}>
      <View {...props}>{children}</View>
    </TouchableOpacity>
  );
};
