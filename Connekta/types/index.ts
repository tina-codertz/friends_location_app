import { Animated } from 'react-native';

/**
 * Floating Word interface for animated background
 */
export interface FloatingWord {
  id: string;
  text: string;
  x: number;
  y: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
  fontSize: number;
  italic: boolean;
  duration: number;
}

/**
 * Animation config interface
 */
export interface AnimationConfig {
  duration: number;
  delay: number;
  useNativeDriver: boolean;
}

/**
 * Screen navigation props
 */
export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  presentation?: 'card' | 'modal' | 'transparentModal' | 'fullScreenModal';
}

/**
 * Theme colors interface
 */
export interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary?: string;
  secondary?: string;
  success?: string;
  error?: string;
  warning?: string;
}

/**
 * Button styles interface
 */
export interface ButtonStyle {
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
}

/**
 * Layout spacing interface
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}
