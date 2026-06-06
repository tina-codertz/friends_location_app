import React from 'react';
import { Text } from '@expo/ui';
import { Font, Type } from '@/constants/typography';
import type { TextStyle } from 'react-native';

type Variant = keyof typeof Type;

type Props = {
  children: string;
  variant?: Variant;
  color?: string;
  textStyle?: TextStyle;
};

/** Expo UI Text with Connekta typography tokens — string children only. */
export function NativeTypography({ children, variant = 'body', color, textStyle }: Props) {
  const base = Type[variant] as TextStyle;
  const merged: TextStyle = {
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    letterSpacing: base.letterSpacing,
    fontFamily: (base.fontFamily as string | undefined) ?? Font.regular,
    color,
    ...textStyle,
  };
  return <Text textStyle={merged}>{children}</Text>;
}
