import { useEffect, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

type Bounds = { x: number; y: number; width: number; height: number };

type UseDragToPitchOptions = {
  maxScale: number;
  buttonAnchor: { x: number; y: number };
  strikeZoneBounds: Bounds | null;
  stoppingLineY: number;
  outerPadding?: number;
  velocityThreshold?: number;
  onOpen: () => void;
  closeSignal: number;
  openDuration?: number;
  closeDuration?: number;
  maxRelevantVelocity?: number;
  minArcDuration?: number;
  maxArcDuration?: number;
  flightScale?: number;
  settlePauseDuration?: number;
  siblingFadeDuration?: number;
  hitStrikeZoneFadeDuration?: number;
  hitFillDuration?: number;
  hitLineDrawRatio?: number;
  screenWidth: number;
  hitAngleTopThresholdPercent?: number;
  hitAngleBottomThresholdPercent?: number;
  hitRightHandedChance?: number;
  trailDissipateDurationRatio?: number;
};

const PITCH_TYPES = [
  { name: 'fastball', arcStrengthRange: [0.2, 0.35] as const, perpendicularRange: [-15, 15] as const },
  { name: 'curveball', arcStrengthRange: [0.5, 0.75] as const, perpendicularRange: [70, 140] as const },
  { name: 'splitter', arcStrengthRange: [1.8, 2.4] as const, perpendicularRange: [-25, 25] as const },
] as const;

const HIT_CHANCE_ON_STRIKE = 0.22;
const HIT_CHANCE_ON_BALL = 0.15;
const EDGE_SWIPE_HORIZONTAL_TOLERANCE = 15;
const PITCH_VERTICAL_ACTIVATION_THRESHOLD = 10;

function randomInRange([min, max]: readonly [number, number]) {
  'worklet';
  return min + Math.random() * (max - min);
}

function pickPitchType() {
  'worklet';
  const index = Math.floor(Math.random() * PITCH_TYPES.length);
  return PITCH_TYPES[index];
}

function randomSettleOffset(bounds: Bounds, buttonAnchor: { x: number; y: number }, outerPadding: number) {
  'worklet';
  const sampleFromTightRange = Math.random() < 0.7;
  const pad = sampleFromTightRange ? 0 : outerPadding;

  const minX = bounds.x - pad;
  const maxX = bounds.x + bounds.width + pad;
  const minY = bounds.y - pad;
  const maxY = bounds.y + bounds.height + pad;

  const targetX = minX + Math.random() * (maxX - minX);
  const targetY = minY + Math.random() * (maxY - minY);

  const isStrike =
    targetX >= bounds.x &&
    targetX <= bounds.x + bounds.width &&
    targetY >= bounds.y &&
    targetY <= bounds.y + bounds.height;

  return { x: targetX - buttonAnchor.x, y: targetY - buttonAnchor.y, isStrike };
}

export function useDragToPitch({
  maxScale,
  buttonAnchor,
  strikeZoneBounds,
  stoppingLineY,
  screenWidth,
  outerPadding = 15,
  velocityThreshold = 900,
  onOpen,
  closeSignal,
  openDuration = 550,
  closeDuration = 250,
  maxRelevantVelocity = 3000,
  minArcDuration = 500,
  maxArcDuration = 900,
  flightScale = 0.135,
  settlePauseDuration = 400,
  siblingFadeDuration = 200,
  hitStrikeZoneFadeDuration = 150,
  hitFillDuration = 580,
  hitLineDrawRatio = 0.55,
  hitAngleTopThresholdPercent = 0.5,
  hitAngleBottomThresholdPercent = 0.25,
  hitRightHandedChance = 0.6,
  trailDissipateDurationRatio = 0.4,
}: UseDragToPitchOptions) {
  const scale = useSharedValue(1);
  const [isActive, setIsActive] = useState(false);
  const [pitchPhase, setPitchPhase] = useState<'rest' | 'pitching' | 'strike' | 'ball'>('rest');
  const [isHit, setIsHit] = useState(false);
  const pastThreshold = useSharedValue(0);
  const strikeZoneVisibility = useSharedValue(0);
  const lineDrawProgress = useSharedValue(0);
  const hitWipeProgress = useSharedValue(0);
  const trailDissipateProgress = useSharedValue(0);
  const [hitAngles, setHitAngles] = useState<{ top: number; bottom: number } | null>(null);
  const [hitMargin, setHitMargin] = useState(16);
  const [hitIsRightHanded, setHitIsRightHanded] = useState(true);
  const [hitLineDistances, setHitLineDistances] = useState({
    topMinus: 0,
    topPlus: 0,
    bottomMinus: 0,
    bottomPlus: 0,
  });

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const arcProgress = useSharedValue(0);
  const startOffsetX = useSharedValue(0);
  const startOffsetY = useSharedValue(0);
  const settleOffsetX = useSharedValue(0);
  const settleOffsetY = useSharedValue(0);
  const controlOffsetX = useSharedValue(0);
  const controlOffsetY = useSharedValue(0);
  const settlePauseTimer = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const t = arcProgress.value;
    const oneMinusT = 1 - t;
    const x =
      oneMinusT * oneMinusT * startOffsetX.value +
      2 * oneMinusT * t * controlOffsetX.value +
      t * t * settleOffsetX.value;
    const y =
      oneMinusT * oneMinusT * startOffsetY.value +
      2 * oneMinusT * t * controlOffsetY.value +
      t * t * settleOffsetY.value;

    const finalX = t > 0 ? x : dragX.value;
    const finalY = t > 0 ? y : dragY.value;

    return {
      transform: [{ translateX: finalX }, { translateY: finalY }, { scale: scale.value }],
    };
  });

  useEffect(() => {
    if (closeSignal > 0) {
      scale.value = withTiming(1, { duration: closeDuration });
      arcProgress.value = withTiming(0, { duration: closeDuration });
      dragX.value = withTiming(0, { duration: closeDuration });
      dragY.value = withTiming(0, { duration: closeDuration });
      lineDrawProgress.value = 0;
      hitWipeProgress.value = 0;
      trailDissipateProgress.value = 0;
      setIsActive(false);
      setPitchPhase('rest');
      setIsHit(false);
      setHitAngles(null);
      setHitLineDistances({ topMinus: 0, topPlus: 0, bottomMinus: 0, bottomPlus: 0 });
      pastThreshold.value = 0;
      strikeZoneVisibility.value = 0;
    }
  }, [closeSignal, closeDuration, scale, arcProgress, dragX, dragY, setIsActive, pastThreshold, strikeZoneVisibility, lineDrawProgress, hitWipeProgress, trailDissipateProgress]);

  function applyResetState() {
    setIsActive(false);
    setPitchPhase('rest');
    setIsHit(false);
    setHitAngles(null);
    setHitLineDistances({ topMinus: 0, topPlus: 0, bottomMinus: 0, bottomPlus: 0 });
  }

  function applyHitGeometryState(topAngle: number, bottomAngle: number, margin: number, distances: { topMinus: number; topPlus: number; bottomMinus: number; bottomPlus: number }) {
    setHitAngles({ top: topAngle, bottom: bottomAngle });
    setHitMargin(margin);
    setHitLineDistances(distances);
  }

  const gesture = useMemo(() => {
    function resetAfterTransition() {
      'worklet';
      pastThreshold.value = withDelay(100, withTiming(0, { duration: 0 }));
      strikeZoneVisibility.value = withDelay(100, withTiming(0, { duration: 0 }));
      arcProgress.value = withDelay(100, withTiming(0, { duration: 0 }));
      scale.value = withDelay(100, withTiming(1, { duration: 0 }));
      dragX.value = withDelay(100, withTiming(0, { duration: 0 }));
      dragY.value = withDelay(100, withTiming(0, { duration: 0 }));
      lineDrawProgress.value = withDelay(100, withTiming(0, { duration: 0 }));
      hitWipeProgress.value = withDelay(100, withTiming(0, { duration: 0 }));
      trailDissipateProgress.value = withDelay(100, withTiming(0, { duration: 0 }));
      runOnJS(applyResetState)();
    }

    function runExpand() {
      'worklet';
      pastThreshold.value = withTiming(1, { duration: siblingFadeDuration });

      scale.value = withTiming(maxScale, { duration: openDuration }, (finished) => {
        if (finished) {
          runOnJS(onOpen)();
          resetAfterTransition();
        }
      });
    }

    function runHitWipe(topAngle: number, bottomAngle: number, margin: number, isRightHanded: boolean) {
      'worklet';
      strikeZoneVisibility.value = withTiming(0, { duration: hitStrikeZoneFadeDuration });

      const ballX = buttonAnchor.x + settleOffsetX.value;
      const topRad = (topAngle * Math.PI) / 180;
      const bottomRad = (bottomAngle * Math.PI) / 180;

      function distanceToGenuineEdge(startX: number, directionCos: number) {
        'worklet';
        if (directionCos > 0) return (screenWidth - startX) / directionCos;
        if (directionCos < 0) return -startX / directionCos;
        return Infinity;
      }

      const topMinusDist = distanceToGenuineEdge(ballX, -Math.cos(topRad));
      const topPlusDist = distanceToGenuineEdge(ballX, Math.cos(topRad));
      const bottomMinusDist = distanceToGenuineEdge(ballX, -Math.cos(bottomRad));
      const bottomPlusDist = distanceToGenuineEdge(ballX, Math.cos(bottomRad));

      const distToEdge = Math.max(topMinusDist, topPlusDist, bottomMinusDist, bottomPlusDist);

      runOnJS(applyHitGeometryState)(topAngle, bottomAngle, margin, {
        topMinus: topMinusDist,
        topPlus: topPlusDist,
        bottomMinus: bottomMinusDist,
        bottomPlus: bottomPlusDist,
      });

      const fullLineLength = screenWidth * 1.5;
      const referenceDuration = hitFillDuration * hitLineDrawRatio;
      const speedPxPerMs = fullLineLength / referenceDuration;
      const hitLineDrawDuration = distToEdge / speedPxPerMs;

      lineDrawProgress.value = withTiming(1, { duration: hitLineDrawDuration }, (drawFinished) => {
        if (drawFinished) {
          hitWipeProgress.value = withTiming(1, { duration: hitFillDuration }, (fillFinished) => {
            if (fillFinished) {
              runOnJS(onOpen)();
              resetAfterTransition();
            }
          });
        }
      });
    }

    function triggerExpand(delayMs: number = 0) {
      'worklet';
      if (delayMs > 0) {
        settlePauseTimer.value = withTiming(1, { duration: delayMs }, (finished) => {
          if (finished) {
            settlePauseTimer.value = 0;
            runExpand();
          }
        });
      } else {
        runExpand();
      }
    }

    function triggerPitch(releaseX: number, releaseY: number, velocityX: number, velocityY: number, velocityMagnitude: number) {
      'worklet';
      pastThreshold.value = withTiming(1, { duration: siblingFadeDuration });
      strikeZoneVisibility.value = withDelay(siblingFadeDuration, withTiming(1, { duration: siblingFadeDuration }));
      startOffsetX.value = releaseX;
      startOffsetY.value = releaseY;
      runOnJS(setPitchPhase)('pitching');

      const bounds = strikeZoneBounds ?? { x: buttonAnchor.x + 100, y: buttonAnchor.y - 300, width: 80, height: 110 };
      const settle = randomSettleOffset(bounds, buttonAnchor, outerPadding);
      settleOffsetX.value = settle.x;
      settleOffsetY.value = settle.y;
      const isStrike = settle.isStrike;

      const hitChance = isStrike ? HIT_CHANCE_ON_STRIKE : HIT_CHANCE_ON_BALL;
      const initialDidHit = Math.random() < hitChance;

      let finalDidHit = false;
      let chosenTopAngle = 0;
      let chosenBottomAngle = 0;
      let chosenMargin = 16;
      let chosenIsRightHanded = true;

      if (initialDidHit) {
        const MIN_ANGLE_DEG = -10;
        const MAX_ANGLE_DEG = 70;
        const TOP_ANGLE_OFFSET_DEG = 2;

        const ballX = buttonAnchor.x + settle.x;
        const ballY = buttonAnchor.y + settle.y;

        const isRightHanded = Math.random() < hitRightHandedChance;
        const handednessCenter = isRightHanded ? 0 : 180;
        const margin = 16 + Math.random() * (32 - 16);
        const bottomLineY = ballY + margin;

        let finalTopAngle = 0;
        let finalBottomAngle = 0;
        let constraintPassed = false;

        if (strikeZoneBounds) {
          const topThresholdY = strikeZoneBounds.y - hitAngleTopThresholdPercent * strikeZoneBounds.height;
          const bottomThresholdY = strikeZoneBounds.y + hitAngleBottomThresholdPercent * strikeZoneBounds.height;

          const clampedY = Math.max(topThresholdY, Math.min(bottomThresholdY, ballY));
          const normalized = (clampedY - topThresholdY) / (bottomThresholdY - topThresholdY);
          const targetHandsY = topThresholdY + normalized * (bottomThresholdY - topThresholdY);

          function angularDiff(a: number, b: number) {
            'worklet';
            const step1 = ((a - b + 180) % 360 + 360) % 360;
            return step1 - 180;
          }
          const handsEdgeX = isRightHanded ? screenWidth : 0;
          const rawDirectionDeg = (Math.atan2(targetHandsY - bottomLineY, handsEdgeX - ballX) * 180) / Math.PI;
          const diff1 = angularDiff(rawDirectionDeg, handednessCenter);
          const diff2 = angularDiff(rawDirectionDeg + 180, handednessCenter);
          const rawSolvedAngle = Math.abs(diff1) <= Math.abs(diff2) ? diff1 : diff2;

          const effectiveMin = isRightHanded ? -MAX_ANGLE_DEG : MIN_ANGLE_DEG;
          const effectiveMax = isRightHanded ? -MIN_ANGLE_DEG : MAX_ANGLE_DEG;

          constraintPassed = rawSolvedAngle >= effectiveMin && rawSolvedAngle <= effectiveMax;

          if (constraintPassed) {
            const delta = isRightHanded ? TOP_ANGLE_OFFSET_DEG : -TOP_ANGLE_OFFSET_DEG;
            const pairedAngle = Math.max(effectiveMin, Math.min(effectiveMax, rawSolvedAngle + delta));
            finalBottomAngle = handednessCenter + rawSolvedAngle;
            finalTopAngle = handednessCenter + pairedAngle;
          }
        }

        if (constraintPassed) {
          finalDidHit = true;
          chosenTopAngle = finalTopAngle;
          chosenBottomAngle = finalBottomAngle;
          chosenMargin = margin;
          chosenIsRightHanded = isRightHanded;
          runOnJS(setHitIsRightHanded)(isRightHanded);
        }
      }

      const dirMag = Math.sqrt(velocityX ** 2 + velocityY ** 2) || 1;
      const dx = velocityX / dirMag;
      const dy = velocityY / dirMag;
      const perpDx = -dy;
      const perpDy = dx;

      const pitchType = pickPitchType();
      const arcStrength = randomInRange(pitchType.arcStrengthRange);
      const perpendicularOffset = randomInRange(pitchType.perpendicularRange);

      const dxSettle = settle.x - releaseX;
      const dySettle = settle.y - releaseY;
      const straightLineDistance = Math.sqrt(dxSettle ** 2 + dySettle ** 2);

      controlOffsetX.value =
        releaseX + dx * straightLineDistance * arcStrength + perpDx * perpendicularOffset;
      controlOffsetY.value =
        releaseY + dy * straightLineDistance * arcStrength + perpDy * perpendicularOffset;

      const clampedVelocity = Math.min(maxRelevantVelocity, Math.max(velocityThreshold, velocityMagnitude));
      const vt = (clampedVelocity - velocityThreshold) / (maxRelevantVelocity - velocityThreshold);
      const duration = maxArcDuration - vt * (maxArcDuration - minArcDuration);

      scale.value = withTiming(flightScale, { duration });

      arcProgress.value = withTiming(1, { duration, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(setPitchPhase)(isStrike ? 'strike' : 'ball');
          runOnJS(setIsHit)(finalDidHit);
          trailDissipateProgress.value = withTiming(1, { duration: duration * trailDissipateDurationRatio });
          if (finalDidHit) {
            runHitWipe(chosenTopAngle, chosenBottomAngle, chosenMargin, chosenIsRightHanded);
          } else {
            triggerExpand(settlePauseDuration);
          }
        }
      });
    }

    const panGesture = Gesture.Pan()
      .minDistance(8)
      .activeOffsetY([-PITCH_VERTICAL_ACTIVATION_THRESHOLD, PITCH_VERTICAL_ACTIVATION_THRESHOLD])
      .failOffsetX([-EDGE_SWIPE_HORIZONTAL_TOLERANCE, EDGE_SWIPE_HORIZONTAL_TOLERANCE])
      .onBegin(() => {
        runOnJS(setIsActive)(true);
      })
      .onUpdate((e) => {
        dragX.value = e.translationX;
        dragY.value = Math.max(e.translationY, stoppingLineY);
      })
      .onEnd((e) => {
        const fingerPastLine = e.translationY <= stoppingLineY;
        const velocityMagnitude = Math.sqrt(e.velocityX ** 2 + e.velocityY ** 2);
        const meetsVelocityThreshold = velocityMagnitude >= velocityThreshold;
        const isThrownAwayFromUser = e.velocityY < 0;

        if (!fingerPastLine && meetsVelocityThreshold && isThrownAwayFromUser) {
          const releaseX = dragX.value;
          const releaseY = dragY.value;
          scale.value = 1;
          triggerPitch(releaseX, releaseY, e.velocityX, e.velocityY, velocityMagnitude);
        } else {
          dragX.value = withSpring(0, { dampingRatio: 0.9, duration: 600 });
          dragY.value = withSpring(0, { dampingRatio: 0.9, duration: 600 });
          scale.value = withSpring(1, { dampingRatio: 0.9, duration: 600 });
          runOnJS(setIsActive)(false);
        }
      });

    const tapGesture = Gesture.Tap()
      .maxDuration(10000)
      .maxDistance(6)
      .onEnd(() => {
        runOnJS(setIsActive)(true);
        triggerExpand();
      });

    return Gesture.Race(tapGesture, panGesture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    maxScale,
    buttonAnchor.x,
    buttonAnchor.y,
    strikeZoneBounds,
    stoppingLineY,
    screenWidth,
    outerPadding,
    velocityThreshold,
    onOpen,
    openDuration,
    maxRelevantVelocity,
    minArcDuration,
    maxArcDuration,
    flightScale,
    settlePauseDuration,
    siblingFadeDuration,
    hitStrikeZoneFadeDuration,
    hitFillDuration,
    hitLineDrawRatio,
    hitAngleTopThresholdPercent,
    hitAngleBottomThresholdPercent,
    hitRightHandedChance,
    trailDissipateDurationRatio,
  ]);

  return {
    gesture,
    animatedStyle,
    isActive,
    scale,
    pastThreshold,
    strikeZoneVisibility,
    pitchPhase,
    isHit,
    lineDrawProgress,
    hitWipeProgress,
    settleOffsetX,
    settleOffsetY,
    buttonAnchor,
    hitAngles,
    hitMargin,
    hitLineDistances,
    hitIsRightHanded,
    startOffsetX,
    startOffsetY,
    controlOffsetX,
    controlOffsetY,
    arcProgress,
    trailDissipateProgress,
  };
}

export type UseDragToPitchReturn = ReturnType<typeof useDragToPitch>;