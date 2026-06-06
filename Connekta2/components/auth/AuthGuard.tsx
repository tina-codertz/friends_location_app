import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Blocks child routes until session is restored; redirects to sign-in when logged out.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const { colors, accent } = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={accent.electricBlue} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/auth/AuthScreen" />;
  }

  return <>{children}</>;
}
