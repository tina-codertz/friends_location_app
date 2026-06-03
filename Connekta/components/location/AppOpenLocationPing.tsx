import { useAuth } from '@/context/AuthContext';
import { useAppOpenLocationPing } from '@/hooks/useAppOpenLocationPing';

/** Runs app-wide location ping when sharing is on (any tab). */
export function AppOpenLocationPing() {
  const { isLoggedIn, user } = useAuth();
  useAppOpenLocationPing(isLoggedIn, user?.uid ?? null);
  return null;
}
