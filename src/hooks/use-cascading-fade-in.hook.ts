import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const DEFAULT_STAGGER_DELAY_MS = 120;
const DEFAULT_FADE_DURATION_MS = 400;
const DEFAULT_TRANSLATE_Y_START = 12;

type CascadingFadeInOptions = {
  staggerDelayMs?: number;
  fadeDurationMs?: number;
  translateYStart?: number;
  enabled?: boolean;
};

export function useCascadingFadeIn(index: number, options?: CascadingFadeInOptions) {
  const staggerDelayMs = options?.staggerDelayMs ?? DEFAULT_STAGGER_DELAY_MS;
  const fadeDurationMs = options?.fadeDurationMs ?? DEFAULT_FADE_DURATION_MS;
  const translateYStart = options?.translateYStart ?? DEFAULT_TRANSLATE_Y_START;
  const enabled = options?.enabled ?? true;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;
    progress.value = withDelay(index * staggerDelayMs, withTiming(1, { duration: fadeDurationMs }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, progress, enabled]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * translateYStart }],
  }));
}