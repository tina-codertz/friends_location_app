import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_CONTENT_HEIGHT } from '@/constants/layout';
import { useAppTheme } from '@/context/ThemeContext';

type TabKey = 'map' | 'friends' | 'emergency' | 'settings';

const TAB_META: Record<
  TabKey,
  { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  map: { icon: 'map-outline', iconActive: 'map' },
  friends: { icon: 'people-outline', iconActive: 'people' },
  emergency: { icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark' },
  settings: { icon: 'person-circle-outline', iconActive: 'person-circle' },
};

const VISIBLE_TABS: TabKey[] = ['map', 'friends', 'emergency', 'settings'];

function tabKeyFromRoute(name: string): TabKey | null {
  if (name === 'map') return 'map';
  if (name === 'friends') return 'friends';
  if (name === 'emergency') return 'emergency';
  if (name === 'settings') return 'settings';
  return null;
}

export function ConnektaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, accent, isDark } = useAppTheme();

  const routes = state.routes.filter((r) => tabKeyFromRoute(r.name) != null);
  const ordered = VISIBLE_TABS.map((key) => routes.find((r) => tabKeyFromRoute(r.name) === key)).filter(
    Boolean
  ) as typeof routes;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopColor: colors.glassBorderLight,
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={72}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? 'rgba(31,31,34,0.88)' : 'rgba(255,255,255,0.92)' },
        ]}
      />
      <View style={[styles.row, { height: TAB_BAR_CONTENT_HEIGHT }]}>
        {ordered.map((route) => {
          const key = tabKeyFromRoute(route.name)!;
          const index = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === index;
          const meta = TAB_META[key];
          const { options } = descriptors[route.key];

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              {focused ? (
                <View
                  style={[
                    styles.activeOrb,
                    {
                      backgroundColor: accent.cyanDeep,
                      shadowColor: accent.cyan,
                    },
                  ]}
                >
                  <Ionicons name={meta.iconActive} size={26} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons
                  name={meta.icon}
                  size={26}
                  color={colors.textMuted}
                  style={{ opacity: 0.75 }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
});
