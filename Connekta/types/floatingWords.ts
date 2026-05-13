import { Animated } from 'react-native';

export interface FloatingWord {
  text: string;
  x: number;
  y: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
  fontSize: number;
  italic: boolean;
}

