/**
 * Swallows keep-awake activation failures in dev (Android Activity not ready yet).
 * @see https://github.com/expo/expo/issues — expo/withDevTools calls useKeepAwake
 */
import { useEffect, useId } from 'react';
import type { KeepAwakeOptions } from 'expo-keep-awake';
import ExpoKeepAwake from '../node_modules/expo-keep-awake/src/ExpoKeepAwake';
import {
  isAvailableAsync,
  deactivateKeepAwake,
  activateKeepAwake,
  ExpoKeepAwakeTag,
  addListener,
} from '../node_modules/expo-keep-awake/src/index';

export {
  isAvailableAsync,
  deactivateKeepAwake,
  activateKeepAwake,
  ExpoKeepAwakeTag,
  addListener,
};

export async function activateKeepAwakeAsync(tag: string = ExpoKeepAwakeTag): Promise<void> {
  try {
    await ExpoKeepAwake.activate?.(tag);
  } catch {
    /* ignore — common when Activity is not ready during Expo dev startup */
  }
}

export function useKeepAwake(tag?: string, options?: KeepAwakeOptions): void {
  const defaultTag = useId();
  const tagOrDefault = tag ?? defaultTag;

  useEffect(() => {
    let isMounted = true;
    void activateKeepAwakeAsync(tagOrDefault).then(() => {
      if (isMounted && ExpoKeepAwake.addListenerForTag && options?.listener) {
        addListener(tagOrDefault, options.listener);
      }
    });

    return () => {
      isMounted = false;
      deactivateKeepAwake(tagOrDefault).catch(() => {});
    };
  }, [tagOrDefault, options?.listener]);
}
