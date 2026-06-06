import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/** Registers push tokens and wires notification tap → in-app routes. */
export function PushNotificationSetup() {
  const { isLoggedIn, user } = useAuth();
  usePushNotifications(isLoggedIn, user?.uid ?? null);
  return null;
}
