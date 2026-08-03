import { THEME } from '@/utils/theme';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    interpolateColor,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';
import {
    CYCLE_DURATION,
    DRAW_STAGGER,
    LOGO_CUBE_LINE_LENGTH,
    LOGO_CUBE_LINES,
    LOGO_CUBE_POLYGON_PERIMETER,
    LOGO_CUBE_POLYGON_POINTS,
    LOGO_ICON_VIEWBOX,
    LOGO_SQUARE_PERIMETER,
    LOGO_SQUARE_POLYGON_POINTS,
    LOGO_STROKE_WIDTH_CUBE,
    LOGO_STROKE_WIDTH_SQUARE,
    RATE_MS_PER_UNIT,
    ROTATE_DECAY_OSCILLATIONS,
    ROTATE_DECAY_RATE,
    ROTATE_DURATION,
    ROTATE_OVERSHOOT_DEGREES,
    ROTATE_PHASE_START,
    ROTATE_SWING_OUT_FRACTION,
    SETTLE_DURATION,
    STROKE_CLOSE_OVERLAP,
} from '../branding.constants';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedLine = Animated.createAnimatedComponent(Line);

function useElementAnimatedProps(
  cycleMs: { value: number },
  orderIndex: number,
  length: number,
  blendColors: [string, string, string],
  settledColor: string,
  overlap: number = 0,
) {
  const startDelay = orderIndex * DRAW_STAGGER;
  const duration = length * RATE_MS_PER_UNIT;
  const drawEnd = startDelay + duration;
  const settleEnd = drawEnd + SETTLE_DURATION;

  return useAnimatedProps(() => {
    const t = cycleMs.value;

    const drawT = interpolate(t, [startDelay, drawEnd], [0, 1], Extrapolation.CLAMP);
    const dashoffset = interpolate(drawT, [0, 1], [length, -overlap]);

    const colorT = interpolate(t, [startDelay, drawEnd, settleEnd], [0, 2, 3], Extrapolation.CLAMP);
    const stroke = interpolateColor(colorT, [0, 1, 2, 3], [blendColors[0], blendColors[1], blendColors[2], settledColor]);

    return { strokeDashoffset: dashoffset, stroke };
  });
}

type LoadingSpinnerProps = {
  size?: number;
  color?: string;
  blendColors?: [string, string, string];
};

export function LoadingSpinner({ size = 100, color, blendColors }: LoadingSpinnerProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const settledColor = color ?? theme.foreground;
  const resolvedBlend: [string, string, string] = blendColors ?? [theme.level3, theme.level1, theme.level2];

  const cycleMs = useSharedValue(0);

  useEffect(() => {
    cycleMs.value = withRepeat(
      withTiming(CYCLE_DURATION, { duration: CYCLE_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
  }, [cycleMs]);

  const hexagonProps = useElementAnimatedProps(cycleMs, 0, LOGO_CUBE_POLYGON_PERIMETER, resolvedBlend, settledColor, STROKE_CLOSE_OVERLAP);
  const line1Props = useElementAnimatedProps(cycleMs, 1, LOGO_CUBE_LINE_LENGTH, resolvedBlend, settledColor);
  const line2Props = useElementAnimatedProps(cycleMs, 2, LOGO_CUBE_LINE_LENGTH, resolvedBlend, settledColor);
  const line3Props = useElementAnimatedProps(cycleMs, 3, LOGO_CUBE_LINE_LENGTH, resolvedBlend, settledColor);
  const squareProps = useElementAnimatedProps(cycleMs, 4, LOGO_SQUARE_PERIMETER, resolvedBlend, settledColor, STROKE_CLOSE_OVERLAP);

  const rotateStyle = useAnimatedStyle(() => {
  const t = cycleMs.value;
  const swingOutEnd = ROTATE_PHASE_START + ROTATE_DURATION * ROTATE_SWING_OUT_FRACTION;
  const settleEnd = ROTATE_PHASE_START + ROTATE_DURATION;

  let degrees: number;

  if (t < swingOutEnd) {
    const swingT = interpolate(t, [ROTATE_PHASE_START, swingOutEnd], [0, 1], Extrapolation.CLAMP);
    degrees = interpolate(
      Easing.out(Easing.cubic)(swingT),
      [0, 1],
      [0, 360 + ROTATE_OVERSHOOT_DEGREES],
    );
  } else if (t < settleEnd) {
    const localT = interpolate(t, [swingOutEnd, settleEnd], [0, 1], Extrapolation.CLAMP);
    const w = 2 * Math.PI * ROTATE_DECAY_OSCILLATIONS;
    const k = ROTATE_DECAY_RATE;
    const g = Math.exp(-k * localT) * (Math.cos(w * localT) + (k / w) * Math.sin(w * localT));
    degrees = 360 + ROTATE_OVERSHOOT_DEGREES * g;
  } else {
    degrees = 360;
  }

  return { transform: [{ rotate: `${degrees}deg` }] };
});

  return (
    <Animated.View style={[{ width: size, height: size }, rotateStyle]}>
      <Svg width={size} height={size} viewBox={LOGO_ICON_VIEWBOX}>
        <AnimatedPolygon points={LOGO_CUBE_POLYGON_POINTS} fill="none" strokeWidth={LOGO_STROKE_WIDTH_CUBE} strokeDasharray={LOGO_CUBE_POLYGON_PERIMETER} animatedProps={hexagonProps} strokeLinecap="round" strokeLinejoin="round" />
        <AnimatedLine {...LOGO_CUBE_LINES[0]} strokeWidth={LOGO_STROKE_WIDTH_CUBE} strokeDasharray={LOGO_CUBE_LINE_LENGTH} animatedProps={line1Props} />
        <AnimatedLine {...LOGO_CUBE_LINES[1]} strokeWidth={LOGO_STROKE_WIDTH_CUBE} strokeDasharray={LOGO_CUBE_LINE_LENGTH} animatedProps={line2Props} />
        <AnimatedLine {...LOGO_CUBE_LINES[2]} strokeWidth={LOGO_STROKE_WIDTH_CUBE} strokeDasharray={LOGO_CUBE_LINE_LENGTH} animatedProps={line3Props} />
        <AnimatedPolygon points={LOGO_SQUARE_POLYGON_POINTS} fill="none" strokeWidth={LOGO_STROKE_WIDTH_SQUARE} strokeDasharray={LOGO_SQUARE_PERIMETER} animatedProps={squareProps} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}