import { useEffect, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withDecay, withTiming } from 'react-native-reanimated';

const DECAY_DECELERATION = 0.9995;

export function useWheelPicker(
  itemCount: number,
  itemHeight: number,
  selectedIndex: number,
  onIndexChange: (index: number) => void
) {
  const translateY = useSharedValue(-selectedIndex * itemHeight);
  const dragStartY = useSharedValue(0);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const targetY = -selectedIndex * itemHeight;
    if (translateY.value !== targetY) {
      translateY.value = withTiming(targetY, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, itemHeight]);

  function commitIndex(index: number) {
    const clamped = Math.max(0, Math.min(itemCount - 1, index));
    isInternalUpdate.current = true;
    onIndexChange(clamped);
  }

  const gesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = dragStartY.value + e.translationY;
    })
    .onEnd((e) => {
      const minY = -(itemCount - 1) * itemHeight;
      const maxY = 0;

      translateY.value = withDecay(
        {
          velocity: e.velocityY,
          deceleration: DECAY_DECELERATION,
          clamp: [minY, maxY],
        },
        (finished) => {
          if (finished) {
            const settledIndex = Math.round(-translateY.value / itemHeight);
            const clampedIndex = Math.max(0, Math.min(itemCount - 1, settledIndex));
            translateY.value = withTiming(-clampedIndex * itemHeight, { duration: 150 });
            runOnJS(commitIndex)(clampedIndex);
          }
        }
      );
    })

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { gesture, translateY, containerStyle };
}