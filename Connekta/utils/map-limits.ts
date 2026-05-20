/** Avoid rendering hundreds of native markers (major perf hit on Android). */
export const MAX_FRIEND_MARKERS_MAIN = 20;
export const MAX_FRIEND_MARKERS_PREVIEW = 12;
export const MAX_PLACE_MARKERS_MAIN = 12;

export function capList<T>(items: T[] | null | undefined, max: number): T[] {
  if (!items?.length) return [];
  return items.length <= max ? items : items.slice(0, max);
}
