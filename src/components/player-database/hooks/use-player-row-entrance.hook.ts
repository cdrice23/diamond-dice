import { useEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const ENTRANCE_DURATION = 320;
const ENTRANCE_OFFSET_Y = 18;
const ENTRANCE_OFFSET_X = -30;
const STAGGER_PER_ROW_MS = 40;
const MAX_STAGGER_MS = 350;

export function usePlayerRowEntrance(indexInBatch: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(indexInBatch * STAGGER_PER_ROW_MS, MAX_STAGGER_MS);
    progress.value = withDelay(delay, withTiming(1, { duration: ENTRANCE_DURATION, easing: Easing.out(Easing.cubic) }));
  }, [indexInBatch, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * ENTRANCE_OFFSET_Y },
      { translateX: (1 - progress.value) * ENTRANCE_OFFSET_X },
    ],
  }));
}