import React from 'react';
import { Text } from '@expo/ui';
import { Font, Type } from '@/constants/typography';
import type { TextStyle } from 'react-native';

type Variant = keyof typeof Type;
type ExpoTextStyle = NonNullable<React.ComponentProps<typeof Text>['textStyle']>;

type Props = {
  children: string;
  variant?: Variant;
  color?: string;
  textStyle?: TextStyle;
};

function toExpoTextStyle(base: TextStyle, color?: string, extra?: TextStyle): ExpoTextStyle {
  const merged = { ...base, color, ...extra };
  const style: ExpoTextStyle = {
    fontSize: merged.fontSize,
    lineHeight: merged.lineHeight,
    letterSpacing: merged.letterSpacing,
    fontFamily: (merged.fontFamily as string | undefined) ?? Font.regular,
    color,
  };
  const fw = merged.fontWeight;
  if (typeof fw === 'string' && /^(normal|bold|[1-9]00)$/.test(fw)) {
    style.fontWeight = fw as ExpoTextStyle['fontWeight'];
  } else if (typeof fw === 'number' && fw >= 100 && fw <= 900) {
    style.fontWeight = String(fw) as ExpoTextStyle['fontWeight'];
  }
  return style;
}

/** Expo UI Text with Connekta typography tokens — string children only. */
export function NativeTypography({ children, variant = 'body', color, textStyle }: Props) {
  const base = Type[variant] as TextStyle;
  return <Text textStyle={toExpoTextStyle(base, color, textStyle)}>{children}</Text>;
}
