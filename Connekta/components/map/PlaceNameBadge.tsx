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
    <View style={styles.bubble} collapsable={false}>
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    maxWidth: 160,
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
    flexShrink: 0,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 13,
    flexShrink: 1,
  },
});
