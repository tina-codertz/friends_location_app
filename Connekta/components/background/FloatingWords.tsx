/**
 * FloatingWords — Animated floating keyword background
 *
 * Renders Connekta feature keywords that fade in, drift
 * upward, and fade out in a continuous loop. Purely
 * decorative — pointerEvents="none".
 *
 * Based on the AnimatedBg reference design.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Word pool ───────────────────────────────────────────────────────────────
const WORDS = [
  'Real-Time Location',
  'Mutual Friendship',
  'Friend Requests',
  'Live Map Updates',
  'Only Friends Can See You',
  'Username Only',
  'Share Location',
  'Accept or Reject',
  'Opt-In Privacy',
  'Face ID Unlock',
  'See Friends on Map',
  'Stop Sharing Anytime',
  'Always Up to Date',
  'No Password Needed',
  'Device Auth',
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface FloatingWord {
  text: string;
  x: number;
  y: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
  fontSize: number;
  italic: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createWord(text: string): FloatingWord {
  return {
    text,
    x: Math.random() * (SW - 200),
    y: Math.random() * (SH - 60),
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(0),
    fontSize: Math.random() > 0.5 ? 13 : 11,
    italic: Math.random() > 0.5,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function FloatingWords() {
  const words = useRef<FloatingWord[]>(
    WORDS.map((w) => createWord(w))
  ).current;

  useEffect(() => {
    words.forEach((word, i) => {
      const delay = i * 400;
      const loop = () => {
        word.opacity.setValue(0);
        word.translateY.setValue(0);
        Animated.sequence([
          Animated.delay(delay + Math.random() * 2000),
          Animated.parallel([
            Animated.timing(word.opacity, {
              toValue: 0.18 + Math.random() * 0.12,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(word.translateY, {
              toValue: -18,
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(word.opacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reposition for next loop cycle
          word.x = Math.random() * (SW - 200);
          word.y = Math.random() * (SH - 60);
          loop();
        });
      };
      loop();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {words.map((word, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: word.x,
            top: word.y,
            opacity: word.opacity,
            transform: [{ translateY: word.translateY }],
            color: '#ffffff',
            fontSize: word.fontSize,
            fontStyle: word.italic ? 'italic' : 'normal',
            fontWeight: '300',
            letterSpacing: 0.3,
          }}
        >
          {word.text}
        </Animated.Text>
      ))}
    </View>
  );
}
