import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Host, ScrollView } from '@expo/ui';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  hostStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom')[];
};

/** React Native shell + Expo UI Host — use at the root of every screen. */
export function NativeScreen({
  children,
  scroll = false,
  style,
  hostStyle,
  contentStyle,
  edges = ['top'],
}: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;

  const host = (
    <Host style={[{ flex: 1 }, hostStyle]}>
      {scroll ? (
        <ScrollView>
          <View style={[{ paddingTop, paddingBottom, paddingHorizontal: 20 }, contentStyle]}>
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop, paddingBottom }, contentStyle]}>{children}</View>
      )}
    </Host>
  );

  return <View style={[styles.shell, { backgroundColor: colors.bg }, style]}>{host}</View>;
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});
