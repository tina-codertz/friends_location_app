/**
 * Animation Types for the Landing Page and App Components
 */

export interface FloatingWord {
  id: string;
  text: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
}

export interface AnimationConfig {
  duration: number;
  delay: number;
  tension: number;
  friction: number;
}

export interface BackgroundGradient {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface LandingPageState {
  isAnimating: boolean;
  hasSeenLanding: boolean;
}

export type AnimationType = 'floating' | 'fade' | 'slide' | 'pulse' | 'scale';

export interface AnimatedComponentProps {
  duration?: number;
  delay?: number;
  type?: AnimationType;
  children?: React.ReactNode;
}
