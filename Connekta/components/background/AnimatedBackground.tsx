import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

const { height: SH } = Dimensions.get('window');

/**
 * AnimatedBackground - Simple floating animated background elements
 * Used in landing page and other screens for visual depth.
 * Adapts glow colour to device theme via useAppTheme().
 */
export default function AnimatedBackground() {
  const { colors } = useAppTheme();
  const animations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const opacityAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const elements = [
      { delay: 0, duration: 4000 },
      { delay: 500, duration: 5000 },
      { delay: 1000, duration: 4500 },
      { delay: 1500, duration: 5500 },
      { delay: 2000, duration: 4000 },
    ];

    elements.forEach((el, idx) => {
      const startTimer = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnimations[idx], {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(animations[idx], {
              toValue: -SH,
              duration: el.duration,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnimations[idx], {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, el.delay);

      return () => clearTimeout(startTimer);
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background glow effect — themed */}
      <View style={[styles.glow, { backgroundColor: colors.tealGlow }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '10%',
    left: '50%',
    marginLeft: -150,
  },
});
