import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { hasCompletedOnboarding } from '@/services/onboarding';

/**
 * App entry: map → if signed in; else landing (first time) or auth.
 */
export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();
  const { colors, accent } = useAppTheme();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    void hasCompletedOnboarding().then(setOnboardingDone);
  }, []);

  if (isLoading || onboardingDone === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
        }}>
        <ActivityIndicator color={accent.electricBlue} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/map" />;
  }

  if (!onboardingDone) {
    return <Redirect href="/(landing)" />;
  }

  return <Redirect href="/auth/AuthScreen" />;
}
