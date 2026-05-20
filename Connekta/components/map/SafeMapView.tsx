import React from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';
import MapView, { type MapViewProps, type Region } from 'react-native-maps';
import Constants from 'expo-constants';
import { HAS_ANDROID_MAPS_KEY } from '@/constants/features';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';

function resolveMapsKey(): boolean {
  if (Platform.OS === 'ios') return true;
  const extra = Constants.expoConfig?.extra as { googleMapsAndroidApiKey?: string } | undefined;
  return HAS_ANDROID_MAPS_KEY || !!extra?.googleMapsAndroidApiKey?.trim();
}

type Props = MapViewProps & {
  containerStyle?: ViewStyle;
  fallbackMessage?: string;
};

/**
 * On Android release builds, MapView crashes without a Google Maps API key.
 * Renders a safe placeholder instead of mounting native maps.
 */
export function SafeMapView({
  children,
  style,
  containerStyle,
  fallbackMessage,
  ...mapProps
}: Props) {
  const { colors } = useAppTheme();
  const canRenderMap = resolveMapsKey();

  if (!canRenderMap) {
    return (
      <View style={[styles.fallback, containerStyle, style]}>
        <Text style={[Type.body, { color: colors.textMuted, textAlign: 'center', fontFamily: Font.medium }]}>
          {fallbackMessage ??
            'Map requires EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY in your EAS build environment.'}
        </Text>
      </View>
    );
  }

  return (
    <MapView style={style} {...mapProps}>
      {children}
    </MapView>
  );
}

export type { Region };

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
});
