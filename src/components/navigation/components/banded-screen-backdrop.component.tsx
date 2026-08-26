import { Background } from '@/components/shared/background/background.component';
import { hslToTransparentHsla } from '@/utils/color';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePitchState } from '../pitch-state.context';

type BandedScreenBackdropProps = {
  svgColor: string;
  backgroundColor: string;
  topBandHeight?: number;
  bottomBandHeight?: number;
  fadeHeight?: number;
  topBandBackgroundColor?: string;
  topBandSvgColor?: string;
};

const DEFAULT_TOP_BAND_HEIGHT = 100;
const NAV_CLEARANCE_HEIGHT = 100;
const DEFAULT_FADE_HEIGHT = 48;
const BACKDROP_TRANSITION_DURATION = 800;
const TOP_OVERRIDE_SVG_OPACITY = 0.65;
const TOP_OVERRIDE_FADE_LOCATIONS: [number, number, number] = [0, 0.15, 1];

export function BandedScreenBackdrop({
  svgColor,
  backgroundColor,
  topBandHeight = DEFAULT_TOP_BAND_HEIGHT,
  bottomBandHeight = NAV_CLEARANCE_HEIGHT,
  fadeHeight = DEFAULT_FADE_HEIGHT,
  topBandBackgroundColor,
  topBandSvgColor,
}: BandedScreenBackdropProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
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
  const clampedFadeHeight = Math.min(fadeHeight, maskHeight > 0 ? maskHeight : fadeHeight, topVisibleHeight, bottomVisibleHeight);

  const transparent = hslToTransparentHsla(backgroundColor);
  const hasTopBandOverride = topBandBackgroundColor !== undefined || topBandSvgColor !== undefined;
  const resolvedTopBandBackgroundColor = topBandBackgroundColor ?? backgroundColor;
  const resolvedTopBandSvgColor = topBandSvgColor ?? svgColor;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]} pointerEvents="none">
      <Animated.View
        style={[StyleSheet.absoluteFill, svgFadeStyle, hasTopBandOverride ? { top: topVisibleHeight } : null]}
      >
        <Background color={svgColor} opacity={0.4} />
      </Animated.View>

      {!hasTopBandOverride && (
        <View
          style={{
            position: 'absolute',
            top: topVisibleHeight - clampedFadeHeight,
            left: 0,
            right: 0,
            height: clampedFadeHeight,
          }}
        >
          <LinearGradient
            colors={[transparent, backgroundColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

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

      <View
        style={{
          position: 'absolute',
          top: topVisibleHeight + maskHeight,
          left: 0,
          right: 0,
          height: clampedFadeHeight,
        }}
      >
        <LinearGradient
          colors={[backgroundColor, transparent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {hasTopBandOverride && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: topVisibleHeight,
            overflow: 'hidden',
            backgroundColor: resolvedTopBandBackgroundColor,
          }}
        >
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['white', 'white', 'transparent']}
                locations={TOP_OVERRIDE_FADE_LOCATIONS}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <View style={{ position: 'absolute', top: 0, left: 0, width: screenWidth, height: screenHeight }}>
              <Background color={resolvedTopBandSvgColor} opacity={TOP_OVERRIDE_SVG_OPACITY} />
            </View>
          </MaskedView>
        </View>
      )}
    </View>
  );
}