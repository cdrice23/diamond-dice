import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Bounds = { x: number; y: number; width: number; height: number };

type PitchCurveBackdropProps = {
  strikeZoneBounds: Bounds | null;
  visibility: SharedValue<number>;
  pastThreshold: SharedValue<number>;
  fillColor: string;
};

const MIN_STOP_OPACITY = 0.25;
const MAX_STOP_OPACITY = 0.65;
const START_OFFSET_Y = 20;
const FINAL_OVAL_WIDTH_MULTIPLIER = 4;
const TOP_HEIGHT_FRACTION = 0.15;

export function PitchCurveBackdrop({ strikeZoneBounds, visibility, pastThreshold, fillColor }: PitchCurveBackdropProps) {
  const containerRef = useRef<View>(null);
  const [measured, setMeasured] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [stopOpacity, setStopOpacity] = useState(MIN_STOP_OPACITY);
  const [gradientFadeOffset, setGradientFadeOffset] = useState(90);

  function handleLayout() {
    containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMeasured({ x, y, width, height });
    });
  }

  const shadowTransition = useSharedValue(0);
  const translateProgress = useSharedValue(0);
  const SHADOW_TRANSITION_DURATION = 1000;
  const startingScale = useSharedValue(0.1);
  const edgeReachFraction = useSharedValue(0.6);
  const gradientTransition = useSharedValue(0);
  const GRADIENT_TRANSITION_DURATION = 1000;

  useEffect(() => {
    if (strikeZoneBounds && measured) {
      const finalFullWidth = measured.width * FINAL_OVAL_WIDTH_MULTIPLIER;
      const computedStartingScale = strikeZoneBounds.width / finalFullWidth;
      const scaleAtEdge = measured.width / finalFullWidth;
      const progressAtEdge = (scaleAtEdge - computedStartingScale) / (1 - computedStartingScale);
      startingScale.value = computedStartingScale;
      edgeReachFraction.value = Math.min(0.95, Math.max(0.02, progressAtEdge));
    }
  }, [strikeZoneBounds, measured, startingScale, edgeReachFraction]);

  useAnimatedReaction(
    () => pastThreshold.value,
    (current, previous) => {
      const justStarted = current > 0 && (previous === null || previous === 0);
      const justEnded = current === 0 && previous !== null && previous > 0;
      if (justStarted) {
        shadowTransition.value = withTiming(1, { duration: SHADOW_TRANSITION_DURATION });
        const delayMs = edgeReachFraction.value * SHADOW_TRANSITION_DURATION;
        const phase2DurationMs = SHADOW_TRANSITION_DURATION - delayMs;
        translateProgress.value = withDelay(delayMs, withTiming(1, { duration: phase2DurationMs }));
        gradientTransition.value = withTiming(1, { duration: GRADIENT_TRANSITION_DURATION });
      } else if (justEnded) {
        shadowTransition.value = withTiming(0, { duration: SHADOW_TRANSITION_DURATION });
        translateProgress.value = withTiming(0, { duration: SHADOW_TRANSITION_DURATION });
        gradientTransition.value = withTiming(0, { duration: GRADIENT_TRANSITION_DURATION });
      }
    }
  );

  const lastBridgeTime = useSharedValue(0);
  const THROTTLE_MS = 30;

  useAnimatedReaction(
    () => gradientTransition.value,
    (current) => {
      const now = Date.now();
      if (now - lastBridgeTime.value < THROTTLE_MS && current > 0 && current < 1) {
        return;
      }
      lastBridgeTime.value = now;

      const opacity = MIN_STOP_OPACITY + current * (MAX_STOP_OPACITY - MIN_STOP_OPACITY);
      runOnJS(setStopOpacity)(opacity);

      const fadeStartOffset = 90 - current * 90;
      runOnJS(setGradientFadeOffset)(fadeStartOffset);
    }
  );

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  const scaleAndTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: START_OFFSET_Y * (1 - translateProgress.value) },
      { scale: startingScale.value + shadowTransition.value * (1 - startingScale.value) },
    ],
  }));

  const geometry = useMemo(() => {
    if (!strikeZoneBounds || !measured) return null;

    const apexX = measured.width / 2;
    const apexY = strikeZoneBounds.y - measured.y + strikeZoneBounds.height + 64;
    const finalFullWidth = measured.width * FINAL_OVAL_WIDTH_MULTIPLIER;
    const finalHalfWidth = finalFullWidth / 2;
    const fillBottomY = measured.height * 0.9;
    const totalHeightRange = fillBottomY - apexY;
    const topHalfHeight = totalHeightRange * TOP_HEIGHT_FRACTION;
    const bottomHalfHeight = totalHeightRange * (1 - TOP_HEIGHT_FRACTION);
    const ovalCenterY = apexY + topHalfHeight;

    const symmetricHalfHeight = Math.max(topHalfHeight, bottomHalfHeight);
    const ovalHeight = symmetricHalfHeight * 2;

    const leftX = 0;
    const rightX = finalFullWidth;
    const centerX = finalHalfWidth;
    const topY = symmetricHalfHeight - topHalfHeight;
    const centerY = symmetricHalfHeight;
    const bottomY = symmetricHalfHeight + bottomHalfHeight;

    const topControlY = (topY - 0.25 * centerY - 0.25 * centerY) / 0.5;
    const bottomControlY = (bottomY - 0.25 * centerY - 0.25 * centerY) / 0.5;

    return {
      finalFullWidth,
      ovalHeight,
      wrapperStyle: {
        position: 'absolute' as const,
        left: apexX - finalHalfWidth,
        top: ovalCenterY - symmetricHalfHeight,
      },
      pathData: `M ${leftX},${centerY} Q ${centerX},${topControlY} ${rightX},${centerY} Q ${centerX},${bottomControlY} ${leftX},${centerY} Z`,
    };
  }, [strikeZoneBounds, measured]);

  const wrapperStyle = geometry?.wrapperStyle ?? { position: 'absolute' as const, top: 0, left: 0 };

  const content = geometry ? (
    <Svg width={geometry.finalFullWidth} height={geometry.ovalHeight}>
      <Defs>
        <LinearGradient id="curveFade" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor={fillColor} stopOpacity={stopOpacity} />
          <Stop offset={`${gradientFadeOffset}%`} stopColor={fillColor} stopOpacity={stopOpacity} />
          <Stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={geometry.pathData} fill="url(#curveFade)" />
    </Svg>
  ) : null;

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Animated.View style={[wrapperStyle, opacityStyle, scaleAndTranslateStyle]}>{content}</Animated.View>
    </View>
  );
}