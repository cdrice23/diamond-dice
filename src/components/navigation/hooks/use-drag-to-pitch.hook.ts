import { useEffect, useState } from 'react';
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
};

const PITCH_TYPES = [
  { name: 'fastball', arcStrengthRange: [0.2, 0.35] as const, perpendicularRange: [-15, 15] as const },
  { name: 'curveball', arcStrengthRange: [0.5, 0.75] as const, perpendicularRange: [70, 140] as const },
  { name: 'splitter', arcStrengthRange: [1.8, 2.4] as const, perpendicularRange: [-25, 25] as const },
] as const;

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
  outerPadding = 15,
  velocityThreshold = 900,
  onOpen,
  closeSignal,
  openDuration = 550,
  closeDuration = 250,
  maxRelevantVelocity = 3000,
  minArcDuration = 500,
  maxArcDuration = 900,
  flightScale = 0.135, // 0.45 reduced by ~70%, per feedback
  settlePauseDuration = 400,
  siblingFadeDuration = 200,
}: UseDragToPitchOptions) {
  const scale = useSharedValue(1);
  const [isActive, setIsActive] = useState(false);
  const [pitchPhase, setPitchPhase] = useState<'rest' | 'pitching' | 'strike' | 'ball'>('rest');
  const pastThreshold = useSharedValue(0);
  const strikeZoneVisibility = useSharedValue(0);

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
      setIsActive(false);
      setPitchPhase('rest');
      pastThreshold.value = 0;
      strikeZoneVisibility.value = 0;
    }
  }, [closeSignal, closeDuration, scale, arcProgress, dragX, dragY, setIsActive, pastThreshold, strikeZoneVisibility]);

  function runExpand() {
    'worklet';
    pastThreshold.value = withTiming(1, { duration: siblingFadeDuration });

    scale.value = withTiming(maxScale, { duration: openDuration }, (finished) => {
      if (finished) {
        runOnJS(onOpen)();
        pastThreshold.value = withDelay(100, withTiming(0, { duration: 0 }));
        strikeZoneVisibility.value = withDelay(100, withTiming(0, { duration: 0 }));
        arcProgress.value = withDelay(100, withTiming(0, { duration: 0 }));
        scale.value = withDelay(100, withTiming(1, { duration: 0 }));
        dragX.value = withDelay(100, withTiming(0, { duration: 0 }));
        dragY.value = withDelay(100, withTiming(0, { duration: 0 }));
        runOnJS(setIsActive)(false);
        runOnJS(setPitchPhase)('rest');
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
        triggerExpand(settlePauseDuration);
      }
    });
  }

  const panGesture = Gesture.Pan()
    .minDistance(8)
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

  const gesture = Gesture.Race(tapGesture, panGesture);

  return { gesture, animatedStyle, isActive, scale, pastThreshold, strikeZoneVisibility, pitchPhase };
}

export type UseDragToPitchReturn = ReturnType<typeof useDragToPitch>;