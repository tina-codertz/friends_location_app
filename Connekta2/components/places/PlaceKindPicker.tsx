import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassButton } from '@/components/ui/GlassButton';
import { NativeTypography } from '@/components/ui/NativeTypography';
import type { PlaceKind } from '@/types/places';
import { PLACE_KINDS, PLACE_KIND_META } from '@/utils/place-kind';

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
  mutedColor,
  borderColor,
  chipBg,
}: Props) {
  return (
    <View style={styles.wrap}>
      <NativeTypography variant="caption" color={mutedColor} textStyle={{ marginBottom: 8 }}>
        What kind of place is this?
      </NativeTypography>
      <View style={styles.row}>
        {PLACE_KINDS.filter((k) => k !== 'other').map((kind) => {
          const meta = PLACE_KIND_META[kind];
          const selected = value === kind;
          return (
            <GlassButton
              key={kind}
              title={meta.label}
              onPress={() => onChange(kind)}
              variant={selected ? 'chipActive' : 'chip'}
              size="small"
              icon={
                <Ionicons
                  name={meta.icon}
                  size={16}
                  color={selected ? accentColor : mutedColor}
                />
              }
              style={{
                backgroundColor: selected ? `${accentColor}22` : chipBg,
                borderColor: selected ? accentColor : borderColor,
                borderWidth: 1.5,
                borderRadius: 999,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
