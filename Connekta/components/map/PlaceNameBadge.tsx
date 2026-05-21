import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Font } from '@/constants/typography';

type Props = {
  label: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

export function PlaceNameBadge({
  label,
  accentColor,
  backgroundColor,
  textColor,
  borderColor,
}: Props) {
  return (
    <View style={styles.wrap} collapsable={false}>
      <View style={[styles.bubble, { backgroundColor, borderColor }]}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    maxWidth: 140,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 13,
    maxWidth: 100,
  },
});
