import { useCallback, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

type ItemBounds = { top: number; bottom: number };

export function useSlideSelectMenu(itemCount: number, onSelect: (index: number) => void) {
  const activeIndex = useSharedValue(-1);

  const boundsRef = useRef<ItemBounds[]>(
    Array.from({ length: itemCount }, () => ({ top: 0, bottom: 0 }))
  );
  const boundsShared = useSharedValue<ItemBounds[]>(
    Array.from({ length: itemCount }, () => ({ top: 0, bottom: 0 }))
  );

  const reportBounds = useCallback((index: number, top: number, height: number) => {
    boundsRef.current[index] = { top, bottom: top + height };
    boundsShared.value = [...boundsRef.current];
  }, [boundsShared]);

  function findIndexAtY(y: number): number {
    'worklet';
    const bounds = boundsShared.value;
    for (let i = 0; i < bounds.length; i++) {
      if (y >= bounds[i].top && y <= bounds[i].bottom) return i;
    }
    return -1;
  }

  function selectAtY(y: number) {
    'worklet';
    const finalIndex = findIndexAtY(y);
    if (finalIndex >= 0) {
      runOnJS(onSelect)(finalIndex);
    }
    activeIndex.value = -1;
  }

  const gesture = useMemo(() => {
    const panGesture = Gesture.Pan()
      .minDistance(8)
      .onUpdate((e) => {
        activeIndex.value = findIndexAtY(e.y);
      })
      .onEnd((e) => {
        selectAtY(e.y);
      });

    const tapGesture = Gesture.Tap()
      .maxDuration(10000)
      .maxDistance(6)
      .onEnd((e) => {
        activeIndex.value = findIndexAtY(e.y);
        selectAtY(e.y);
      });

    return Gesture.Race(tapGesture, panGesture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gesture, activeIndex, reportBounds };
}