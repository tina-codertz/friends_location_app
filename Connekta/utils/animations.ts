/**
 * Animation Utilities
 */

import { Animated } from 'react-native';

export const createSpringAnimation = (
  value: Animated.Value,
  toValue: number,
  tension: number = 50,
  friction: number = 8
) => {
  return Animated.spring(value, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

export const createTimingAnimation = (
  value: Animated.Value,
  toValue: number,
  duration: number = 500,
  delay: number = 0
) => {
  return Animated.timing(value, {
    toValue,
    duration,
    delay,
    useNativeDriver: true,
  });
};

export const createSequenceAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};

export const createParallelAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

export const createStaggerAnimation = (
  animations: Animated.CompositeAnimation[],
  delay: number = 100
) => {
  return Animated.stagger(delay, animations);
};

/**
 * Validation Utilities
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string, minLength: number = 8): boolean => {
  return password.length >= minLength;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Format Utilities
 */

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};
