import React from 'react';
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { ExpoUIHostScope } from '@/context/ExpoUIContext';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom')[];
};

/**
 * Standard RN screen shell for expo-router routes.
 * Does NOT mount a Host — mixing RN views inside a full-screen Host crashes
 * SwiftUIVirtualView in Expo Go. Use ExpoUIRegion for small @expo/ui islands.
 */
export function NativeScreen({
  children,
  scroll = false,
  style,
  contentStyle,
  edges = ['top'],
}: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;

  const content = (
    <View
      style={[
        scroll ? undefined : { flex: 1 },
        { paddingTop, paddingBottom },
        scroll ? [{ paddingHorizontal: 20 }, contentStyle] : contentStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <ExpoUIHostScope disabled>
      <View style={[styles.shell, { backgroundColor: colors.bg }, style]}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[{ paddingBottom }, contentStyle]}
            style={{ flex: 1, paddingTop, paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </ExpoUIHostScope>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});
