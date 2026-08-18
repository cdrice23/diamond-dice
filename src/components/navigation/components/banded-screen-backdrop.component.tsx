import { Background } from '@/components/shared/background/background.component';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePitchState } from '../pitch-state.context';

type BandedScreenBackdropProps = {
  svgColor: string;
  backgroundColor: string;
  topBandHeight?: number;
  bottomBandHeight?: number;
};

const DEFAULT_TOP_BAND_HEIGHT = 140;
const NAV_CLEARANCE_HEIGHT = 100;
const BACKDROP_TRANSITION_DURATION = 800;

export function BandedScreenBackdrop({
  svgColor,
  backgroundColor,
  topBandHeight = DEFAULT_TOP_BAND_HEIGHT,
  bottomBandHeight = NAV_CLEARANCE_HEIGHT,
}: BandedScreenBackdropProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { pastThreshold } = usePitchState();
  const backdropTransition = useSharedValue(0);

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

  const topVisibleHeight = insets.top + topBandHeight;
  const bottomVisibleHeight = insets.bottom + bottomBandHeight;
  const maskHeight = Math.max(0, screenHeight - topVisibleHeight - bottomVisibleHeight);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, svgFadeStyle]}>
        <Background color={svgColor} opacity={0.4} />
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          top: topVisibleHeight,
          left: 0,
          right: 0,
          height: maskHeight,
          backgroundColor,
        }}
      />
    </View>
  );
}