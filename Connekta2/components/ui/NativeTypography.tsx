import React from 'react';
import { Text as RNText } from 'react-native';
import { Text } from '@expo/ui';
import { Font, Type } from '@/constants/typography';
import { useExpoUI } from '@/context/ExpoUIContext';
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

/** Connekta typography — @expo/ui Text inside ExpoUIRegion, RN Text elsewhere. */
export function NativeTypography({ children, variant = 'body', color, textStyle }: Props) {
  const { isHosted, disabled } = useExpoUI();
  const base = Type[variant] as TextStyle;
  const merged = { ...base, color, ...textStyle };

  if (disabled || !isHosted) {
    return <RNText style={merged}>{children}</RNText>;
  }

  return <Text textStyle={toExpoTextStyle(base, color, textStyle)}>{children}</Text>;
}
