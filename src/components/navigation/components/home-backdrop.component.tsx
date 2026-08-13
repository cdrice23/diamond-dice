import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePitchState } from '../pitch-state.context';

type HomeBackdropProps = {
  imageSource: number;
  backgroundColor: string;
};

const MIN_BLUR_INTENSITY = 5;
const MAX_BLUR_INTENSITY = 100;

export function HomeBackdrop({ imageSource, backgroundColor }: HomeBackdropProps) {
  const { width, height } = useWindowDimensions();
  const { pastThreshold } = usePitchState();
  const [blurIntensity, setBlurIntensity] = useState(MIN_BLUR_INTENSITY);

  const backdropTransition = useSharedValue(0);
  const BACKDROP_TRANSITION_DURATION = 800; // tune to taste

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

  useAnimatedReaction(
    () => backdropTransition.value,
    (current) => {
      const intensity = MIN_BLUR_INTENSITY + current * (MAX_BLUR_INTENSITY - MIN_BLUR_INTENSITY);
      runOnJS(setBlurIntensity)(intensity);
    }
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: backdropTransition.value,
  }));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width, height }} pointerEvents="none">
      <Image source={imageSource} resizeMode="cover" style={{ width, height }} />
      <BlurView intensity={blurIntensity} style={{ position: 'absolute', top: 0, left: 0, width, height }} />
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, width, height, backgroundColor }, overlayStyle]}
      />
    </View>
  );
}