import { useEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const ENTRANCE_DURATION = 320;
const STAGGER_PER_ROW_MS = 40;
const MAX_STAGGER_MS = 350;
const BATCH_SIZE = 20;

export function usePlayerRowEntrance(indexInBatch: number, animate: boolean, reverse: boolean = false) {
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      progress.value = 1;
      return;
    }

    const effectiveIndex = reverse ? BATCH_SIZE - 1 - indexInBatch : indexInBatch;
    const delay = Math.min(Math.max(effectiveIndex, 0) * STAGGER_PER_ROW_MS, MAX_STAGGER_MS);
    progress.value = withDelay(delay, withTiming(1, { duration: ENTRANCE_DURATION, easing: Easing.out(Easing.cubic) }));
  }, [indexInBatch, animate, reverse, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
}