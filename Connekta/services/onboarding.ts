import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'connekta_onboarding_complete';

/** True after the user has registered or signed in at least once on this device. */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}
