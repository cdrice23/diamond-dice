import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';

type HitWipeTransitionProps = {
  isHit: boolean;
  lineDrawProgress: SharedValue<number>;
  hitWipeProgress: SharedValue<number>;
  settleOffsetX: SharedValue<number>;
  settleOffsetY: SharedValue<number>;
  buttonAnchor: { x: number; y: number };
  fillColor: string;
  angles: { top: number; bottom: number } | null;
  margin: number;
  hitLineDistances: { topMinus: number; topPlus: number; bottomMinus: number; bottomPlus: number };
  isRightHanded: boolean;
};

const EDGE_OVERSHOOT = 200;
const FLATTEN_WINDOW_FRACTION = 0.1;

function computeFlattenThreshold(lineY: number, targetIntercept: number, spread: number) {
  const range = Math.abs(targetIntercept - lineY);
  if (range === 0) return 1;
  return Math.min(1, Math.max(0, (2 * spread) / range));
}

function computeAsymmetricPoints(centerX: number, centerY: number, rad: number, minusLength: number, plusLength: number) {
  const p1: [number, number] = [centerX - minusLength * Math.cos(rad), centerY - minusLength * Math.sin(rad)];
  const p2: [number, number] = [centerX + plusLength * Math.cos(rad), centerY + plusLength * Math.sin(rad)];
  return p1[0] < p2[0] ? { left: p1, right: p2 } : { left: p2, right: p1 };
}

function HitWipeTransitionInner({
  isHit,
  lineDrawProgress,
  hitWipeProgress,
  settleOffsetX,
  settleOffsetY,
  buttonAnchor,
  fillColor,
  angles,
  margin,
  hitLineDistances,
  isRightHanded,
}: HitWipeTransitionProps) {
  const containerRef = useRef<View>(null);
  const [measured, setMeasured] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [drawProgress, setDrawProgress] = useState(0);
  const [fillProgress, setFillProgress] = useState(0);

  function handleLayout() {
    containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMeasured({ x, y, width, height });
    });
  }

  useEffect(() => {
    if (isHit) {
      setBallPosition({
        x: buttonAnchor.x + settleOffsetX.value,
        y: buttonAnchor.y + settleOffsetY.value,
      });
    }
  }, [isHit, buttonAnchor, settleOffsetX, settleOffsetY]);

  const lastDrawBridgeTime = useSharedValue(0);
  const lastFillBridgeTime = useSharedValue(0);
  const THROTTLE_MS = 30;

  useAnimatedReaction(
    () => lineDrawProgress.value,
    (current) => {
      const now = Date.now();
      if (now - lastDrawBridgeTime.value < THROTTLE_MS && current > 0 && current < 1) return;
      lastDrawBridgeTime.value = now;
      runOnJS(setDrawProgress)(current);
    }
  );

  useAnimatedReaction(
    () => hitWipeProgress.value,
    (current) => {
      const now = Date.now();
      if (now - lastFillBridgeTime.value < THROTTLE_MS && current > 0 && current < 1) return;
      lastFillBridgeTime.value = now;
      runOnJS(setFillProgress)(current);
    }
  );

  const containerOpacityStyle = useAnimatedStyle(() => ({
    opacity: lineDrawProgress.value > 0 || hitWipeProgress.value > 0 ? 1 : 0,
  }));

  const staticGeometry = useMemo(() => {
    if (!isHit || !measured || !ballPosition || !angles) return null;

    const fullLineLength = measured.width * 1.5;
    const topLineY = ballPosition.y - margin;
    const bottomLineY = ballPosition.y + margin;
    const topRad = (angles.top * Math.PI) / 180;
    const bottomRad = (angles.bottom * Math.PI) / 180;
    const handednessCenterRad = isRightHanded ? 0 : Math.PI;

    const topMinusTarget = hitLineDistances.topMinus;
    const topPlusTarget = hitLineDistances.topPlus;
    const bottomMinusTarget = hitLineDistances.bottomMinus;
    const bottomPlusTarget = hitLineDistances.bottomPlus;

    const topTargetIntercept = -EDGE_OVERSHOOT;
    const bottomTargetIntercept = measured.height + EDGE_OVERSHOOT;

    const topSpread = fullLineLength * Math.abs(Math.sin(topRad));
    const bottomSpread = fullLineLength * Math.abs(Math.sin(bottomRad));

    const topThreshold = computeFlattenThreshold(topLineY, topTargetIntercept, topSpread);
    const bottomThreshold = computeFlattenThreshold(bottomLineY, bottomTargetIntercept, bottomSpread);

    return {
      fullLineLength,
      topLineY,
      bottomLineY,
      topRad,
      bottomRad,
      handednessCenterRad,
      topMinusTarget,
      topPlusTarget,
      bottomMinusTarget,
      bottomPlusTarget,
      topTargetIntercept,
      bottomTargetIntercept,
      topThreshold,
      bottomThreshold,
    };
  }, [isHit, angles, margin, ballPosition, isRightHanded, hitLineDistances, measured]);

  let content = null;
  if (staticGeometry && measured && ballPosition) {
    const {
      fullLineLength,
      topLineY,
      bottomLineY,
      topRad,
      bottomRad,
      handednessCenterRad,
      topMinusTarget,
      topPlusTarget,
      bottomMinusTarget,
      bottomPlusTarget,
      topTargetIntercept,
      bottomTargetIntercept,
      topThreshold,
      bottomThreshold,
    } = staticGeometry;

    const topRawLength = drawProgress * Math.max(topMinusTarget, topPlusTarget);
    const bottomRawLength = drawProgress * Math.max(bottomMinusTarget, bottomPlusTarget);
    const topCurrentMinus = Math.min(topRawLength, topMinusTarget);
    const topCurrentPlus = Math.min(topRawLength, topPlusTarget);
    const bottomCurrentMinus = Math.min(bottomRawLength, bottomMinusTarget);
    const bottomCurrentPlus = Math.min(bottomRawLength, bottomPlusTarget);

    const { left: topLeft, right: topRight } = computeAsymmetricPoints(
      ballPosition.x,
      topLineY,
      topRad,
      topCurrentMinus,
      topCurrentPlus
    );
    const { left: bottomLeft, right: bottomRight } = computeAsymmetricPoints(
      ballPosition.x,
      bottomLineY,
      bottomRad,
      bottomCurrentMinus,
      bottomCurrentPlus
    );

    const topFlattenProgress =
      fillProgress <= topThreshold ? 0 : Math.min(1, (fillProgress - topThreshold) / FLATTEN_WINDOW_FRACTION);
    const bottomFlattenProgress =
      fillProgress <= bottomThreshold ? 0 : Math.min(1, (fillProgress - bottomThreshold) / FLATTEN_WINDOW_FRACTION);

    const topMovingRad = handednessCenterRad + (topRad - handednessCenterRad) * (1 - topFlattenProgress);
    const bottomMovingRad = handednessCenterRad + (bottomRad - handednessCenterRad) * (1 - bottomFlattenProgress);

    const topCurrentIntercept = topLineY * (1 - fillProgress) + topTargetIntercept * fillProgress;
    const { left: topMovingLeft, right: topMovingRight } = computeAsymmetricPoints(
      ballPosition.x,
      topCurrentIntercept,
      topMovingRad,
      fullLineLength,
      fullLineLength
    );

    const bottomCurrentIntercept = bottomLineY * (1 - fillProgress) + bottomTargetIntercept * fillProgress;
    const { left: bottomMovingLeft, right: bottomMovingRight } = computeAsymmetricPoints(
      ballPosition.x,
      bottomCurrentIntercept,
      bottomMovingRad,
      fullLineLength,
      fullLineLength
    );

    const topPolygonPoints = `${topLeft[0]},${topLeft[1]} ${topRight[0]},${topRight[1]} ${topMovingRight[0]},${topMovingRight[1]} ${topMovingLeft[0]},${topMovingLeft[1]}`;
    const bottomPolygonPoints = `${bottomLeft[0]},${bottomLeft[1]} ${bottomRight[0]},${bottomRight[1]} ${bottomMovingRight[0]},${bottomMovingRight[1]} ${bottomMovingLeft[0]},${bottomMovingLeft[1]}`;

    content = (
      <Svg width={measured.width} height={measured.height}>
        {fillProgress > 0 && <Polygon points={topPolygonPoints} fill={fillColor} />}
        {fillProgress > 0 && <Polygon points={bottomPolygonPoints} fill={fillColor} />}
        <Line x1={topLeft[0]} y1={topLeft[1]} x2={topRight[0]} y2={topRight[1]} stroke={fillColor} strokeWidth={3} />
        <Line
          x1={bottomLeft[0]}
          y1={bottomLeft[1]}
          x2={bottomRight[0]}
          y2={bottomRight[1]}
          stroke={fillColor}
          strokeWidth={3}
        />
      </Svg>
    );
  }

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, containerOpacityStyle]}>
        {content}
      </Animated.View>
    </View>
  );
}

export const HitWipeTransition = memo(HitWipeTransitionInner, (prev, next) => {
  return (
    prev.isHit === next.isHit &&
    prev.lineDrawProgress === next.lineDrawProgress &&
    prev.hitWipeProgress === next.hitWipeProgress &&
    prev.settleOffsetX === next.settleOffsetX &&
    prev.settleOffsetY === next.settleOffsetY &&
    prev.buttonAnchor.x === next.buttonAnchor.x &&
    prev.buttonAnchor.y === next.buttonAnchor.y &&
    prev.fillColor === next.fillColor &&
    prev.margin === next.margin &&
    prev.isRightHanded === next.isRightHanded &&
    prev.angles?.top === next.angles?.top &&
    prev.angles?.bottom === next.angles?.bottom &&
    prev.hitLineDistances.topMinus === next.hitLineDistances.topMinus &&
    prev.hitLineDistances.topPlus === next.hitLineDistances.topPlus &&
    prev.hitLineDistances.bottomMinus === next.hitLineDistances.bottomMinus &&
    prev.hitLineDistances.bottomPlus === next.hitLineDistances.bottomPlus
  );
});