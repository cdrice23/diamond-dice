import { Background } from '@/components/shared/background/background.component';
import { View } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePitchState } from '../pitch-state.context';

type ScreenBackdropProps = {
  svgColor: string;
  backgroundColor: string;
};

export function ScreenBackdrop({ svgColor, backgroundColor }: ScreenBackdropProps) {
  const { pastThreshold } = usePitchState();

  const backdropTransition = useSharedValue(0);
  const BACKDROP_TRANSITION_DURATION = 800;

  useAnimatedReaction(
    () => pastThreshold.value,
    (current, previous) => {
      const justStarted = current > 0 && (previous === null || previous === 0);
      const justEnded = current === 0 && previous !== null && previous > 0;
      if (justStarted) {
        backdropTransition.value = withTiming(1, { duration: BACKDROP_TRANSITION_DURATION });
      } else if (justEnded) {
        backdropTransition.value = withTiming(0, { duration: BACKDROP_TRANSITION_DURATION });
      }
    }
  );

  const svgFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - backdropTransition.value,
  }));

  const colorOverlayStyle = useAnimatedStyle(() => ({
    opacity: backdropTransition.value,
  }));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, svgFadeStyle]}>
        <Background color={svgColor} opacity={0.4} />
      </Animated.View>
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor },
          colorOverlayStyle,
        ]}
      />
    </View>
  );
}