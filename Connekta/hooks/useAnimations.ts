/**
 * Custom Hook for Managing Animations
 */

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { AnimationType } from '@/types/animations';

interface UseAnimationConfig {
  duration?: number;
  delay?: number;
  toValue?: number;
  type?: AnimationType;
}

export const useAnimation = ({
  duration = 500,
  delay = 0,
  toValue = 1,
  type = 'fade',
}: UseAnimationConfig = {}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay, toValue, animatedValue]);

  return animatedValue;
};

export const useFloatingAnimation = (
  initialY: number = 0,
  duration: number = 2000,
  offset: number = 20
) => {
  const translateY = useRef(new Animated.Value(initialY)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: initialY + offset,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: initialY,
          duration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [duration, offset, initialY, translateY]);

  return translateY;
};

export const usePulseAnimation = (duration: number = 1000) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [duration, scaleValue]);

  return scaleValue;
};

export const useSlideInAnimation = (
  duration: number = 500,
  fromValue: number = 50,
  delay: number = 0
) => {
  const slideAnim = useRef(new Animated.Value(fromValue)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay, slideAnim, opacityAnim]);

  return { slideAnim, opacityAnim };
};
