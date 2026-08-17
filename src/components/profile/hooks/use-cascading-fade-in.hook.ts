import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const STAGGER_DELAY_MS = 120;
const FADE_DURATION_MS = 400;
const TRANSLATE_Y_START = 12;

export function useCascadingFadeIn(index: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * STAGGER_DELAY_MS, withTiming(1, { duration: FADE_DURATION_MS }));
  }, [index, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * TRANSLATE_Y_START }],
  }));
}