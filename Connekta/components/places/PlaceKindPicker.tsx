import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaceKind } from '@/types/places';
import { PLACE_KINDS, PLACE_KIND_META } from '@/utils/place-kind';
import { Font } from '@/constants/typography';

type Props = {
  value: PlaceKind;
  onChange: (kind: PlaceKind) => void;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  chipBg: string;
};

export function PlaceKindPicker({
  value,
  onChange,
  accentColor,
  textColor,
  mutedColor,
  borderColor,
  chipBg,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.hint, { color: mutedColor }]}>What kind of place is this?</Text>
      <View style={styles.row}>
        {PLACE_KINDS.filter((k) => k !== 'other').map((kind) => {
          const meta = PLACE_KIND_META[kind];
          const selected = value === kind;
          return (
            <TouchableOpacity
              key={kind}
              onPress={() => onChange(kind)}
              activeOpacity={0.85}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? `${accentColor}22` : chipBg,
                  borderColor: selected ? accentColor : borderColor,
                },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={16}
                color={selected ? accentColor : mutedColor}
              />
              <Text
                style={[
                  styles.chipLabel,
                  { color: selected ? textColor : mutedColor, fontFamily: Font.semibold },
                ]}
              >
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  hint: {
    fontFamily: Font.regular,
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontSize: 13,
  },
});
