import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlaceNameBadge } from '@/components/map/PlaceNameBadge';
import { Font } from '@/constants/typography';

type Props = {
  label: string;
  subtitle?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  subtitleColor?: string;
};

/** Badge + optional subtitle — used inside map point annotations. */
export function MapMarkerLabel({
  label,
  subtitle,
  accentColor,
  backgroundColor,
  textColor,
  borderColor,
  subtitleColor,
}: Props) {
  return (
    <View style={styles.wrap} collapsable={false}>
      <PlaceNameBadge
        label={label}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
        borderColor={borderColor}
      />
      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: subtitleColor ?? textColor }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: 168,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.88,
    maxWidth: 156,
    textAlign: 'center',
  },
});
