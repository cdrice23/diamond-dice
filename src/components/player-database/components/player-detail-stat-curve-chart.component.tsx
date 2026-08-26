import type { CurvePoint, CurveTier } from '@/components/player-database/utils/stat-curve-math';
import { buildBandFillPath, curveYAtX } from '@/components/player-database/utils/stat-curve-math';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type PlayerDetailStatCurveChartProps = {
  points: CurvePoint[];
  markerX: number;
  tier: CurveTier;
  bandBoundaries: [number, number];
  higherIsBetter: boolean;
  width: number;
  height: number;
};

const CURVE_DRAW_DURATION = 520;
const FILL_FADE_DURATION = 160;
const MARKER_POP_DURATION = 240;

const START_DELAY = 0;
const FILL_DELAY = START_DELAY + CURVE_DRAW_DURATION;

const BAND_FILL_ALPHA = 0.15;
const TOP_INSET = 10;
const BASELINE_INSET = 6;

export function PlayerDetailStatCurveChart(props: PlayerDetailStatCurveChartProps) {
  const { points, markerX, tier, bandBoundaries, higherIsBetter, width, height } = props;
  const { colors } = useTheme();
  const curveClipId = `statCurveRevealClip-${useId()}`;
  const leftDividerId = `leftDividerClip-${curveClipId}`;
  const rightDividerId = `rightDividerClip-${curveClipId}`;

  const drawableHeight = height - TOP_INSET - BASELINE_INSET;
  const baselineY = TOP_INSET + drawableHeight;

  const toScreenY = (yFraction: number) => baselineY - yFraction * drawableHeight;

  const tierColors: [string, string, string] = higherIsBetter
    ? [colors.level1, colors.level2, colors.level3]
    : [colors.level3, colors.level2, colors.level1];
  const markerColor = tier === 'level1' ? colors.level1 : tier === 'level2' ? colors.level2 : colors.level3;

  const curveProgress = useSharedValue(0);
  const dividerProgress = useSharedValue(0);
  const fillProgress = useSharedValue(0);
  const markerProgress = useSharedValue(0);

  useEffect(() => {
    curveProgress.value = 0;
    dividerProgress.value = 0;
    fillProgress.value = 0;
    markerProgress.value = 0;

    const markerRevealDelay = START_DELAY + markerX * CURVE_DRAW_DURATION;

    curveProgress.value = withDelay(START_DELAY, withTiming(1, { duration: CURVE_DRAW_DURATION }));
    dividerProgress.value = withDelay(START_DELAY, withTiming(1, { duration: CURVE_DRAW_DURATION }));
    fillProgress.value = withDelay(FILL_DELAY, withTiming(1, { duration: FILL_FADE_DURATION }));
    markerProgress.value = withDelay(markerRevealDelay, withTiming(1, { duration: MARKER_POP_DURATION }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, markerX, tier]);

  const curveClipAnimatedProps = useAnimatedProps(() => ({
    width: curveProgress.value * width,
  }));

  const dividerClipAnimatedProps = useAnimatedProps(() => ({
    height: dividerProgress.value * height,
  }));

  const band0AnimatedProps = useAnimatedProps(() => ({
    opacity: fillProgress.value,
  }));

  const band1AnimatedProps = useAnimatedProps(() => ({
    opacity: fillProgress.value,
  }));

  const band2AnimatedProps = useAnimatedProps(() => ({
    opacity: fillProgress.value,
  }));

  const markerAnimatedProps = useAnimatedProps(() => ({
    r: 5 * markerProgress.value,
    opacity: markerProgress.value,
  }));

  const areaPath = (() => {
    if (points.length === 0) return '';
    let d = `M 0 ${baselineY} L 0 ${toScreenY(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x * width} ${toScreenY(points[i].y)}`;
    }
    d += ` L ${width} ${baselineY} Z`;
    return d;
  })();

  const innerHeight = height - TOP_INSET - BASELINE_INSET;
  const band0Path = buildBandFillPath(points, 0, bandBoundaries[0], width, innerHeight);
  const band1Path = buildBandFillPath(points, bandBoundaries[0], bandBoundaries[1], width, innerHeight);
  const band2Path = buildBandFillPath(points, bandBoundaries[1], 1, width, innerHeight);

  const markerY = toScreenY(curveYAtX(points, markerX));
  const markerRevealDelay = START_DELAY + markerX * CURVE_DRAW_DURATION;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Static x-axis baseline -- always present, never animated */}
        <Line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke={colors.border} strokeWidth={1} />

        <Defs>
          <ClipPath id={curveClipId}>
            <AnimatedRect x={0} y={0} height={height} animatedProps={curveClipAnimatedProps} />
          </ClipPath>
          <ClipPath id={leftDividerId}>
            <AnimatedRect x={bandBoundaries[0] * width - 4} y={0} width={8} animatedProps={dividerClipAnimatedProps} />
          </ClipPath>
          <ClipPath id={rightDividerId}>
            <AnimatedRect x={bandBoundaries[1] * width - 4} y={0} width={8} animatedProps={dividerClipAnimatedProps} />
          </ClipPath>
        </Defs>

        <Line
          x1={bandBoundaries[0] * width}
          y1={TOP_INSET}
          x2={bandBoundaries[0] * width}
          y2={baselineY}
          stroke={colors.mutedForeground}
          strokeWidth={1}
          strokeDasharray="4,4"
          clipPath={`url(#${leftDividerId})`}
        />
        <Line
          x1={bandBoundaries[1] * width}
          y1={TOP_INSET}
          x2={bandBoundaries[1] * width}
          y2={baselineY}
          stroke={colors.mutedForeground}
          strokeWidth={1}
          strokeDasharray="4,4"
          clipPath={`url(#${rightDividerId})`}
        />

        <G transform={`translate(0, ${TOP_INSET})`}>
          <AnimatedPath d={band0Path} fill={adjustHslAlpha(tierColors[0], BAND_FILL_ALPHA)} animatedProps={band0AnimatedProps} />
          <AnimatedPath d={band1Path} fill={adjustHslAlpha(tierColors[1], BAND_FILL_ALPHA)} animatedProps={band1AnimatedProps} />
          <AnimatedPath d={band2Path} fill={adjustHslAlpha(tierColors[2], BAND_FILL_ALPHA)} animatedProps={band2AnimatedProps} />
        </G>

        <AnimatedPath
          d={areaPath}
          fill="transparent"
          stroke={colors.mutedForeground}
          strokeWidth={1.5}
          clipPath={`url(#${curveClipId})`}
        />

        <AnimatedCircle
          cx={markerX * width}
          cy={markerY}
          fill={markerColor}
          stroke={colors.background}
          strokeWidth={2}
          animatedProps={markerAnimatedProps}
        />
      </Svg>
    </View>
  );
}