import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { Host, Row, Button, Icon } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_CONTENT_HEIGHT } from '@/constants/layout';
import { useAppTheme } from '@/context/ThemeContext';

type TabKey = 'map' | 'friends' | 'emergency' | 'settings';

const TAB_META: Record<TabKey, { ios: string; md: string; label: string }> = {
  map: { ios: 'map.fill', md: 'map', label: 'Map' },
  friends: { ios: 'person.2.fill', md: 'group', label: 'Friends' },
  emergency: { ios: 'shield.fill', md: 'shield', label: 'Safety' },
  settings: { ios: 'person.crop.circle.fill', md: 'account_circle', label: 'Profile' },
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
  const { colors } = useAppTheme();

  const routes = state.routes.filter((r) => tabKeyFromRoute(r.name) != null);
  const ordered = VISIBLE_TABS.map((key) => routes.find((r) => tabKeyFromRoute(r.name) === key)).filter(
    Boolean,
  ) as typeof routes;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.navCard,
          borderTopColor: colors.glassBorderLight,
        },
      ]}>
      <Host matchContents>
        <Row spacing={0} style={{ height: TAB_BAR_CONTENT_HEIGHT, alignItems: 'center' }}>
          {ordered.map((route) => {
            const key = tabKeyFromRoute(route.name)!;
            const index = state.routes.findIndex((r) => r.key === route.key);
            const focused = state.index === index;
            const meta = TAB_META[key];

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

            return (
              <View key={route.key} style={styles.tab}>
                <Button variant={focused ? 'filled' : 'text'} onPress={onPress}>
                  <Icon
                    name={Icon.select({ ios: meta.ios, android: meta.md, web: meta.md })}
                    size={22}
                    color={focused ? '#fff' : colors.textMuted}
                  />
                </Button>
              </View>
            );
          })}
        </Row>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
