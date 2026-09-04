import { useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const PROJECTION_FACTOR = 0.5;
const MIN_SETTLE_DURATION = 180;
const MAX_SETTLE_DURATION = 650;
const DURATION_PER_ITEM = 22;

export function useWheelPicker(
  itemCount: number,
  itemHeight: number,
  selectedIndex: number,
  onIndexChange: (index: number) => void
) {
  const translateY = useSharedValue(-selectedIndex * itemHeight);
  const dragStartY = useSharedValue(0);
  const lastCommittedIndex = useSharedValue(selectedIndex);

  useEffect(() => {
    if (selectedIndex === lastCommittedIndex.value) return;
     
    lastCommittedIndex.value = selectedIndex;

    const targetY = -selectedIndex * itemHeight;
    if (translateY.value !== targetY) {
       
      translateY.value = withTiming(targetY, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, itemHeight]);

  function commitIndex(index: number) {
    const clamped = Math.max(0, Math.min(itemCount - 1, index));
    // eslint-disable-next-line react-hooks/immutability
    lastCommittedIndex.value = clamped;
    onIndexChange(clamped);
  }

  const minY = -(Math.max(itemCount - 1, 0)) * itemHeight;
  const maxY = 0;

  const gesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      const raw = dragStartY.value + e.translationY;
      // eslint-disable-next-line react-hooks/immutability
      translateY.value = Math.max(minY, Math.min(maxY, raw));
    })
    .onEnd((e) => {
      if (itemHeight <= 0 || itemCount <= 0) return;

      const startY = translateY.value;
      const projectedY = startY + e.velocityY * PROJECTION_FACTOR;
      const boundedY = Math.max(minY, Math.min(maxY, projectedY));

      const rawIndex = Math.round(-boundedY / itemHeight);
      const safeIndex = Number.isFinite(rawIndex) ? Math.max(0, Math.min(itemCount - 1, rawIndex)) : 0;
      const targetY = -safeIndex * itemHeight;

      const itemsTraveled = Math.abs(targetY - startY) / itemHeight;
      const duration = Math.min(
        MAX_SETTLE_DURATION,
        Math.max(MIN_SETTLE_DURATION, itemsTraveled * DURATION_PER_ITEM)
      );

      // eslint-disable-next-line react-hooks/immutability 
      translateY.value = withTiming(targetY, { duration, easing: Easing.out(Easing.cubic) });
      runOnJS(commitIndex)(safeIndex);
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { gesture, translateY, containerStyle };
}