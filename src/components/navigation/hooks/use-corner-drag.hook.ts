import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type UseCornerDragOptions = {
  awayDirection: { x: number; y: number };
  onPitch: () => void;
  velocityThreshold?: number;
  toleranceDegrees?: number;
};

const TAP_DISTANCE_THRESHOLD = 8; 

export function useCornerDrag({ awayDirection, onPitch, velocityThreshold = 800, toleranceDegrees = 75 }: UseCornerDragOptions) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  function isPitch(vx: number, vy: number) {
    'worklet';
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < velocityThreshold) return false;

    const dot = vx * awayDirection.x + vy * awayDirection.y;
    const awayMag = Math.sqrt(awayDirection.x ** 2 + awayDirection.y ** 2);
    const cosAngle = dot / (speed * awayMag);
    const angleDeg = (Math.acos(Math.min(1, Math.max(-1, cosAngle))) * 180) / Math.PI;

    return angleDeg <= toleranceDegrees;
  }

  const panGesture = Gesture.Pan()
    .minDistance(TAP_DISTANCE_THRESHOLD)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (isPitch(e.velocityX, e.velocityY)) {
        translateX.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
        runOnJS(onPitch)();
      } else {
        translateX.value = withSpring(0, { damping: 14, stiffness: 90 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 90 });
      }
    });

  return { panGesture, animatedStyle };
}