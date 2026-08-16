import { memo, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';

type PitchTrailEffectProps = {
  pitchPhase: 'rest' | 'pitching' | 'strike' | 'ball';
  arcProgress: SharedValue<number>;
  trailDissipateProgress: SharedValue<number>;
  startOffsetX: SharedValue<number>;
  startOffsetY: SharedValue<number>;
  controlOffsetX: SharedValue<number>;
  controlOffsetY: SharedValue<number>;
  settleOffsetX: SharedValue<number>;
  settleOffsetY: SharedValue<number>;
  buttonAnchor: { x: number; y: number };
  color: string;
};

const TRAIL_LENGTH_FRACTION = 0.6;
const END_MARGIN_T = 0.03;
const PATH_SAMPLE_POINTS = 16;
const MAX_OPACITY = 0.85;
const THROTTLE_MS = 30;
const STROKE_WIDTH = 4;

function bezierPoint(
  t: number,
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  settleX: number,
  settleY: number
) {
  const oneMinusT = 1 - t;
  const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * controlX + t * t * settleX;
  const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * controlY + t * t * settleY;
  return { x, y };
}

function PitchTrailEffectInner({
  pitchPhase,
  arcProgress,
  trailDissipateProgress,
  startOffsetX,
  startOffsetY,
  controlOffsetX,
  controlOffsetY,
  settleOffsetX,
  settleOffsetY,
  buttonAnchor,
  color,
}: PitchTrailEffectProps) {
  const containerRef = useRef<any>(null);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const [bridgedArcProgress, setBridgedArcProgress] = useState(0);
  const [bridgedDissipateProgress, setBridgedDissipateProgress] = useState(0);
  const [bezierParams, setBezierParams] = useState<{
    startX: number;
    startY: number;
    controlX: number;
    controlY: number;
    settleX: number;
    settleY: number;
  } | null>(null);

  function handleLayout() {
    containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMeasured({ width, height });
    });
  }

  const lastArcBridgeTime = useSharedValue(0);
  const lastDissipateBridgeTime = useSharedValue(0);

  useAnimatedReaction(
    () => arcProgress.value,
    (current, previous) => {
      const now = Date.now();
      if (current > 0 && (previous === null || previous <= 0)) {
        runOnJS(setBezierParams)({
          startX: buttonAnchor.x + startOffsetX.value,
          startY: buttonAnchor.y + startOffsetY.value,
          controlX: buttonAnchor.x + controlOffsetX.value,
          controlY: buttonAnchor.y + controlOffsetY.value,
          settleX: buttonAnchor.x + settleOffsetX.value,
          settleY: buttonAnchor.y + settleOffsetY.value,
        });
      }
      if (now - lastArcBridgeTime.value < THROTTLE_MS && current > 0 && current < 1) return;
      lastArcBridgeTime.value = now;
      runOnJS(setBridgedArcProgress)(current);
    }
  );

  useAnimatedReaction(
    () => trailDissipateProgress.value,
    (current) => {
      const now = Date.now();
      if (now - lastDissipateBridgeTime.value < THROTTLE_MS && current > 0 && current < 1) return;
      lastDissipateBridgeTime.value = now;
      runOnJS(setBridgedDissipateProgress)(current);
    }
  );

  const headT = (pitchPhase === 'pitching' ? bridgedArcProgress : 1) - END_MARGIN_T;
  const settledTrailStart = Math.max(END_MARGIN_T, 1 - TRAIL_LENGTH_FRACTION);
  const trailStartT =
    pitchPhase === 'pitching'
      ? Math.max(END_MARGIN_T, bridgedArcProgress - TRAIL_LENGTH_FRACTION)
      : settledTrailStart + (1 - END_MARGIN_T - settledTrailStart) * bridgedDissipateProgress;

  const geometry = useMemo(() => {
    if (!bezierParams || headT <= trailStartT) return null;
    const { startX, startY, controlX, controlY, settleX, settleY } = bezierParams;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= PATH_SAMPLE_POINTS; i++) {
      const t = trailStartT + (headT - trailStartT) * (i / PATH_SAMPLE_POINTS);
      points.push(bezierPoint(t, startX, startY, controlX, controlY, settleX, settleY));
    }
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const startPt = points[0];
    const endPt = points[points.length - 1];
    return { pathData, startPt, endPt };
  }, [bezierParams, trailStartT, headT]);

  if (pitchPhase === 'rest' || !measured || !geometry) {
    return <View ref={containerRef} onLayout={handleLayout} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />;
  }

  const { pathData, startPt, endPt } = geometry;

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Svg width={measured.width} height={measured.height}>
        <Defs>
          <LinearGradient id="trail-opacity-gradient" gradientUnits="userSpaceOnUse" x1={startPt.x} y1={startPt.y} x2={endPt.x} y2={endPt.y}>
            <Stop offset="0%" stopColor="#000000" />
            <Stop offset="10%" stopColor="#0e0e0e" />
            <Stop offset="20%" stopColor="#444444" />
            <Stop offset="30%" stopColor="#969696" />
            <Stop offset="40%" stopColor="#e1e1e1" />
            <Stop offset="50%" stopColor="#ffffff" />
            <Stop offset="60%" stopColor="#e1e1e1" />
            <Stop offset="70%" stopColor="#969696" />
            <Stop offset="80%" stopColor="#444444" />
            <Stop offset="90%" stopColor="#0e0e0e" />
            <Stop offset="100%" stopColor="#000000" />
          </LinearGradient>

          <Mask id="trail-opacity-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={measured.width} height={measured.height}>
            <Rect x={0} y={0} width={measured.width} height={measured.height} fill="url(#trail-opacity-gradient)" />
          </Mask>
        </Defs>

        <Path
          d={pathData}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeOpacity={MAX_OPACITY}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          mask="url(#trail-opacity-mask)"
        />
      </Svg>
    </View>
  );
}

export const PitchTrailEffect = memo(PitchTrailEffectInner, (prev, next) => {
  return (
    prev.pitchPhase === next.pitchPhase &&
    prev.arcProgress === next.arcProgress &&
    prev.trailDissipateProgress === next.trailDissipateProgress &&
    prev.startOffsetX === next.startOffsetX &&
    prev.startOffsetY === next.startOffsetY &&
    prev.controlOffsetX === next.controlOffsetX &&
    prev.controlOffsetY === next.controlOffsetY &&
    prev.settleOffsetX === next.settleOffsetX &&
    prev.settleOffsetY === next.settleOffsetY &&
    prev.buttonAnchor.x === next.buttonAnchor.x &&
    prev.buttonAnchor.y === next.buttonAnchor.y &&
    prev.color === next.color
  );
});