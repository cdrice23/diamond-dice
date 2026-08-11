import { useEffect, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type UseDragToExpandOptions = {
  awayDirection: { x: number; y: number };
  maxScale: number;
  maxDragDistance?: number;
  completionThreshold?: number;
  velocityThreshold?: number;
  onOpen: () => void;
  closeSignal: number;
  openDuration?: number;
  closeDuration?: number;
};

export function useDragToExpand({
  awayDirection,
  maxScale,
  maxDragDistance = 300,
  completionThreshold = 0.6,
  velocityThreshold = 900,
  onOpen,
  closeSignal,
  openDuration = 350,
  closeDuration = 250,
}: UseDragToExpandOptions) {
  const scale = useSharedValue(1);
  const [isActive, setIsActive] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (closeSignal > 0) {
      scale.value = withTiming(1, { duration: closeDuration });
      setIsActive(false);
    }
  }, [closeSignal]);

  function triggerOpen() {
    'worklet';
    scale.value = withTiming(maxScale, { duration: openDuration }, (finished) => {
      if (finished) runOnJS(onOpen)();
    });
  }

  const awayMag = Math.sqrt(awayDirection.x ** 2 + awayDirection.y ** 2);

  const panGesture = Gesture.Pan()
    .minDistance(8)
    .onBegin(() => {
      runOnJS(setIsActive)(true);
    })
    .onUpdate((e) => {
      const projected = (e.translationX * awayDirection.x + e.translationY * awayDirection.y) / awayMag;
      const progress = Math.min(1, Math.max(0, projected / maxDragDistance));
      scale.value = 1 + progress * (maxScale - 1);
    })
    .onEnd((e) => {
      const projected = (e.translationX * awayDirection.x + e.translationY * awayDirection.y) / awayMag;
      const progress = Math.min(1, Math.max(0, projected / maxDragDistance));
      const velocityProjected = (e.velocityX * awayDirection.x + e.velocityY * awayDirection.y) / awayMag;

      if (progress >= completionThreshold || velocityProjected >= velocityThreshold) {
        triggerOpen();
      } else {
        scale.value = withSpring(1, { damping: 32, stiffness: 150 });
        runOnJS(setIsActive)(false);
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(10000)
    .maxDistance(6)
    .onEnd(() => {
      runOnJS(setIsActive)(true);
      triggerOpen();
    });

  const gesture = Gesture.Race(tapGesture, panGesture);

  return { gesture, animatedStyle, isActive, scale };
}