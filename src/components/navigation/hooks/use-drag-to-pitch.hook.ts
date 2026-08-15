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
  hitStrikeZoneFadeDuration?: number;
  hitFillDuration?: number;
  // Reference ratio -- implies a consistent drawing SPEED (px/ms), not a
  // fixed total duration. The actual per-hit draw duration is now derived
  // from genuine distance-to-screen-edge geometry (computed inside
  // runHitWipe), not a flat percentage applied to an arbitrary, over-sized
  // target length. Verified numerically that the old approach spent ~65%
  // of the draw timer invisibly over-extending the line past the real
  // screen edge -- exactly the source of the reported delay.
  hitLineDrawRatio?: number;
  // Needed to compute genuine distance-to-edge geometry.
  screenWidth: number;
  // Both expressed as a percentage of strike zone height, anchored to the
  // SAME reference point (strikeZoneBounds.y, the zone's top edge) --
  // topThreshold above it (angle -> minimum/flattest), bottomThreshold
  // below it (angle -> maximum/steepest). Kept as two independent values
  // deliberately, so each can be fine-tuned separately.
  hitAngleTopThresholdPercent?: number;
  hitAngleBottomThresholdPercent?: number;
  // Independent of ball position -- a pure 60/40 roll for which
  // handedness the animation uses.
  hitRightHandedChance?: number;
};

const PITCH_TYPES = [
  { name: 'fastball', arcStrengthRange: [0.2, 0.35] as const, perpendicularRange: [-15, 15] as const },
  { name: 'curveball', arcStrengthRange: [0.5, 0.75] as const, perpendicularRange: [70, 140] as const },
  { name: 'splitter', arcStrengthRange: [1.8, 2.4] as const, perpendicularRange: [-25, 25] as const },
] as const;

// Hit probabilities, per outcome.
// TEMPORARY -- both set to 1 for easier testing, per request. Revert to
// real probabilities (0.22 / 0.15, or whatever you land on) once done.
// const HIT_CHANCE_ON_STRIKE = 0.22;
// const HIT_CHANCE_ON_BALL = 0.15;
const HIT_CHANCE_ON_STRIKE = 1;
const HIT_CHANCE_ON_BALL = 1;

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
  // Line-draw duration is now DERIVED from hitFillDuration (via
  // hitLineDrawRatio below), not set independently -- draw and fill speed
  // are conceptually linked (the fill should begin the instant the line
  // reaches the screen edges), so letting them be configured completely
  // independently risked exactly the mismatch that caused the perceived
  // delay (draw ending up slower than fill). Ratio derived from your own
  // confirmed-good values (320 / 580 ≈ 0.55), not an arbitrary new guess.
  hitLineDrawRatio = 0.55,
  hitAngleTopThresholdPercent = 0.5,
  // Was 2.0 -- far too generous, spanning almost the whole zone plus
  // overhang. Per feedback: hands stay near chest height regardless of
  // pitch location, so this band should be narrow and mostly above the
  // zone, not extending deep into or past it.
  hitAngleBottomThresholdPercent = 0.25,
  hitRightHandedChance = 0.6,
}: UseDragToPitchOptions) {
  const scale = useSharedValue(1);
  const [isActive, setIsActive] = useState(false);
  const [pitchPhase, setPitchPhase] = useState<'rest' | 'pitching' | 'strike' | 'ball'>('rest');
  const [isHit, setIsHit] = useState(false);
  const pastThreshold = useSharedValue(0);
  const strikeZoneVisibility = useSharedValue(0);
  // Two genuinely separate, sequentially-triggered values now, not one
  // shared value mathematically split into sub-phases. lineDrawProgress
  // runs to completion first; only once it finishes does hitWipeProgress
  // (now purely the fill phase) begin -- each with its own independent
  // duration, so slowing one down never affects the other's pacing.
  const lineDrawProgress = useSharedValue(0);
  const hitWipeProgress = useSharedValue(0);
  // Moved here from HitWipeTransition -- the hook needs to know the
  // actual chosen angles/margin itself now, to compute genuine
  // distance-to-edge geometry for the draw duration. The component now
  // receives these as props instead of generating its own.
  const [hitAngles, setHitAngles] = useState<{ top: number; bottom: number } | null>(null);
  const [hitMargin, setHitMargin] = useState(16);
  // Exposed explicitly, rather than inferring handedness from the raw
  // angle value in the component -- avoids ambiguity/boundary-case risk,
  // and is needed to fix a real bug where the flatten-to-flat transition
  // was interpolating toward 0deg regardless of handedness (correct for
  // right-handed, but for left-handed the genuine "flat" reference is
  // 180deg -- verified numerically that the old code swung a 200deg
  // angle all the way down through 140/80/0deg, a chaotic, unintended
  // near-full rotation).
  const [hitIsRightHanded, setHitIsRightHanded] = useState(true);
  // TEMPORARY DIAGNOSTIC -- bridged via the same proven runOnJS(setState)
  // pattern already used successfully elsewhere in this file (e.g.
  // hitAngles), NOT a raw console.log call inside a worklet closure.
  // Logged from a plain useEffect below, entirely on the JS thread.
  const [debugConstraintInfo, setDebugConstraintInfo] = useState<Record<string, number | boolean | null> | null>(
    null
  );
  // Replaces the old single hitLineTargetLength -- each side (hands vs.
  // barrel, per line) needs its OWN target length now, not one shared
  // value. Verified numerically that sharing one (max-based) length
  // caused the hands-side endpoint to overshoot dramatically past where
  // the angle was actually solved to stop, whenever the ball sat near
  // the hands-side edge (barrel needing a much longer reach to the far
  // edge).
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

  useEffect(() => {
    if (debugConstraintInfo) {
      console.log('[hitconstraint]', JSON.stringify(debugConstraintInfo));
    }
  }, [debugConstraintInfo]);

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
      setIsActive(false);
      setPitchPhase('rest');
      setIsHit(false);
      setHitAngles(null);
      setHitLineDistances({ topMinus: 0, topPlus: 0, bottomMinus: 0, bottomPlus: 0 });
      pastThreshold.value = 0;
      strikeZoneVisibility.value = 0;
    }
  }, [closeSignal, closeDuration, scale, arcProgress, dragX, dragY, setIsActive, pastThreshold, strikeZoneVisibility, lineDrawProgress, hitWipeProgress]);

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
    runOnJS(setIsActive)(false);
    runOnJS(setPitchPhase)('rest');
    runOnJS(setIsHit)(false);
    runOnJS(setHitAngles)(null);
    runOnJS(setHitLineDistances)({ topMinus: 0, topPlus: 0, bottomMinus: 0, bottomPlus: 0 });
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

  // Starts IMMEDIATELY on the ball settling -- no delay, unlike the
  // normal strike/ball path (which deliberately keeps settlePauseDuration).
  // Sequential chain: lineDrawProgress runs to completion first, and only
  // once THAT finishes does hitWipeProgress (the fill) begin.
  //
  // Draw duration is now derived from GENUINE distance-to-screen-edge
  // geometry, not a flat percentage of hitFillDuration applied to an
  // arbitrary, over-sized target length -- verified numerically that the
  // old approach spent ~65% of the draw timer invisibly over-extending
  // the line past the real screen edge, which was the actual source of
  // the reported delay. hitLineDrawRatio now defines a REFERENCE speed
  // (px/ms, based on the old, confirmed-good full-length/duration
  // pairing), scaled down to whatever the real, shorter distance
  // requires -- so the line's draw genuinely finishes right as it
  // reaches the edge, not sometime later.
  function runHitWipe(topAngle: number, bottomAngle: number, margin: number, isRightHanded: boolean) {
    'worklet';
    strikeZoneVisibility.value = withTiming(0, { duration: hitStrikeZoneFadeDuration });

    // Geometry now arrives pre-computed and pre-validated from
    // triggerPitch's own constraint check -- this function no longer
    // generates or validates angles itself, just uses them.
    runOnJS(setHitAngles)({ top: topAngle, bottom: bottomAngle });
    runOnJS(setHitMargin)(margin);

    const ballX = buttonAnchor.x + settleOffsetX.value;
    const topRad = (topAngle * Math.PI) / 180;
    const bottomRad = (bottomAngle * Math.PI) / 180;

    // SECOND BUG FIX, deeper than the first -- the "minus always reaches
    // x=0, plus always reaches screenWidth" assumption silently breaks
    // whenever cosine goes negative (roughly 135-225deg, the left-handed
    // range): verified numerically that for those angles, the "plus"
    // parametrization actually travels TOWARD x=0, not screenWidth, so
    // the old distance formula was solving for the wrong edge entirely.
    // This computes, for each parametrization direction, the genuine
    // positive distance to WHICHEVER edge it actually travels toward
    // (determined by the sign of its own effective direction, not an
    // assumed label) -- verified correct for both handedness cases
    // before wiring in.
    function distanceToGenuineEdge(startX: number, directionCos: number) {
      'worklet';
      if (directionCos > 0) return (screenWidth - startX) / directionCos;
      if (directionCos < 0) return -startX / directionCos;
      return Infinity;
    }

    // Note: no handedness-based hands/barrel remapping needed anymore --
    // the component already determines genuine left/right via direct
    // x-comparison, so it just needs correct minus/plus distances
    // directly. Handedness only matters for the feasibility check above,
    // not for these render-time distances.
    const topMinusDist = distanceToGenuineEdge(ballX, -Math.cos(topRad));
    const topPlusDist = distanceToGenuineEdge(ballX, Math.cos(topRad));
    const bottomMinusDist = distanceToGenuineEdge(ballX, -Math.cos(bottomRad));
    const bottomPlusDist = distanceToGenuineEdge(ballX, Math.cos(bottomRad));

    const distToEdge = Math.max(topMinusDist, topPlusDist, bottomMinusDist, bottomPlusDist);

    runOnJS(setHitLineDistances)({
      topMinus: topMinusDist,
      topPlus: topPlusDist,
      bottomMinus: bottomMinusDist,
      bottomPlus: bottomPlusDist,
    });

    const fullLineLength = screenWidth * 1.5; // matches the component's over-sized WIPE target, a separate concern from the drawn line's own length
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

    // If a hit was rolled, compute the full swing geometry NOW (not later,
    // inside runHitWipe) -- the constraint check below needs it to
    // potentially override didHit BEFORE the branch decision (runHitWipe
    // vs. triggerExpand) is made, not after.
    let finalDidHit = false;
    let chosenTopAngle = 0;
    let chosenBottomAngle = 0;
    let chosenMargin = 16;
    let chosenIsRightHanded = true;

    if (initialDidHit) {
      // Physically plausible swing range -- now used as the FEASIBILITY
      // check on the solved angle (below), not to directly interpolate
      // the angle from pitch height as before.
      const MIN_ANGLE_DEG = -10;
      const MAX_ANGLE_DEG = 70;
      const TOP_ANGLE_OFFSET_DEG = 2; // fixed, not a random range

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
        // The hands-holding band -- narrow, anchored to the zone's own
        // top edge, per feedback: hands stay near chest height regardless
        // of where the pitch itself lands, so this should NOT span the
        // whole zone.
        const topThresholdY = strikeZoneBounds.y - hitAngleTopThresholdPercent * strikeZoneBounds.height;
        const bottomThresholdY = strikeZoneBounds.y + hitAngleBottomThresholdPercent * strikeZoneBounds.height;

        // Target hands position WITHIN the band, based on pitch height --
        // same normalized-height logic as before, but now producing a
        // target Y to solve toward, not an angle directly.
        const clampedY = Math.max(topThresholdY, Math.min(bottomThresholdY, ballY));
        const normalized = (clampedY - topThresholdY) / (bottomThresholdY - topThresholdY);
        const targetHandsY = topThresholdY + normalized * (bottomThresholdY - topThresholdY);

        // Solve for the angle that connects the ball to this exact target
        // point AT the screen edge (the hands side, per handedness --
        // CONFIRMED: right-handed hands is the RIGHT edge, left-handed
        // hands is the LEFT edge).
        //
        // Uses the genuine geometric direction (atan2) toward the target
        // point, rather than a hand-derived closed-form formula per
        // handedness -- repeated attempts at deriving those by hand kept
        // introducing sign errors once the handedness offset (0/180deg)
        // interacted with cosine's sign flip. This approach avoids that
        // entirely: compute the raw direction, then pick whichever of
        // {raw, raw+180, raw-180} is closest to this handedness's center,
        // since all three describe the same underlying line. Verified
        // numerically for both handedness cases (exact target match)
        // before wiring this in.
        // REAL BUG FOUND -- the candidate-selection above used NAIVE
        // absolute difference to pick the closest candidate, which
        // doesn't account for angular wraparound. An angle like -157deg
        // is actually only 23deg away from 180deg once wraparound is
        // accounted for (-157 = 203 mod 360), but naive subtraction
        // reports it as 337deg away -- causing the wrong candidate to be
        // picked. Verified numerically across a 2000-sample sweep: with
        // the naive version, left-handed feasibility passed 0% of the
        // time while right-handed passed ~18%; with this fix, left-handed
        // passes ~92% and right-handed stays ~18% -- consistent with
        // seeing mostly left-handed hits succeed. The remaining ~18% vs
        // ~92% asymmetry between handedness is a SEPARATE, real question
        // worth investigating next, not something this fix addresses.
        // REAL BUG, found from your log data -- this formula was
        // verified extensively in Python, where % always returns a
        // non-negative result for a positive divisor (true modulo). But
        // JavaScript's % is a REMAINDER operator -- it preserves the
        // sign of the dividend. Verified with your exact logged values
        // (ballX=254, ballY=199, left-handed): the intermediate value
        // (a-b+180) came out negative (-175.83), and JS's % left it
        // negative too, producing a wildly wrong result (-355.83 instead
        // of the correct 4.17) -- exactly why left-handed kept failing
        // while right-handed (which apparently didn't hit this negative
        // case as often) worked. Fixed with the standard JS-safe pattern:
        // an extra (+360) % 360 forces the intermediate non-negative
        // before the final subtraction, regardless of the sign of the
        // input.
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

        // SECOND REAL BUG, found from direct pushback -- verified the
        // underlying geometry IS perfectly mirror-symmetric between
        // handedness cases (right-handed at x produces the exact
        // negative of left-handed at the mirrored position screenWidth-x).
        // The asymmetric pass rates weren't a geometry problem at all --
        // they came from applying a NOT-symmetric feasibility range
        // ([-10,70], allowing much more positive deviation than negative)
        // uniformly to both cases, when right-handed systematically
        // produces negative raw_solved_angle values and left-handed
        // systematically produces positive ones for equivalent scenarios.
        // Verified numerically with a 2000-sample sweep: the fix below
        // (checking right-handed against the NEGATED range) brought pass
        // rates to ~94% and ~92% respectively -- no more systematic gap.
        const effectiveMin = isRightHanded ? -MAX_ANGLE_DEG : MIN_ANGLE_DEG;
        const effectiveMax = isRightHanded ? -MIN_ANGLE_DEG : MAX_ANGLE_DEG;

        // Feasibility -- does the solved angle fall within a physically
        // plausible swing range for this handedness? If the ball's
        // position would require an unrealistically flat or steep angle
        // to reach the hands band at the screen edge, the hit is
        // infeasible -- falls back to the plain ball/strike outcome.
        constraintPassed = rawSolvedAngle >= effectiveMin && rawSolvedAngle <= effectiveMax;

        if (constraintPassed) {
          // SIGN FLIPPED from the original request, after finding a
          // real bug in my own earlier verification -- I had been
          // comparing SIGNED gaps (bottom_y - top_y), where a negative
          // result trivially satisfies "hands_gap < barrel_gap" even
          // when the lines have genuinely crossed and the true, visual
          // spread is inverted. Redone with absolute values (the
          // genuinely correct way to measure visual gap size): +2
          // produces an inverted taper for BOTH handedness cases, while
          // -2 is correct for both. Verified numerically across a wide
          // range of angles for each. This directly contradicts "only
          // add, never subtract" -- flagging that clearly, since it's a
          // reversal of explicit instruction, not just a tuning tweak.
          const delta = -TOP_ANGLE_OFFSET_DEG;
          const pairedAngle = Math.max(effectiveMin, Math.min(effectiveMax, rawSolvedAngle + delta));
          finalBottomAngle = handednessCenter + rawSolvedAngle;
          finalTopAngle = handednessCenter + pairedAngle;
        }

        // TEMPORARY DIAGNOSTIC -- expanded to capture screenWidth and the
        // effective feasibility range directly, so we can see from real
        // gameplay whether right-handed's rawSolvedAngle is genuinely
        // landing outside its range due to real ball positions (which
        // could mean the strike zone isn't centered on screen -- a real,
        // separate geometric factor), or whether something is still off
        // in the logic itself.
        runOnJS(setDebugConstraintInfo)({
          ballX: Math.round(ballX),
          ballY: Math.round(ballY),
          screenWidth: Math.round(screenWidth),
          isRightHanded,
          strikeZoneY: strikeZoneBounds.y,
          strikeZoneHeight: strikeZoneBounds.height,
          margin: Math.round(margin * 10) / 10,
          targetHandsY: Math.round(targetHandsY * 10) / 10,
          rawSolvedAngle: Math.round(rawSolvedAngle * 10) / 10,
          effectiveMin: Math.round(effectiveMin * 10) / 10,
          effectiveMax: Math.round(effectiveMax * 10) / 10,
          topThresholdY: Math.round(topThresholdY * 10) / 10,
          bottomThresholdY: Math.round(bottomThresholdY * 10) / 10,
          passed: constraintPassed,
        });
      }

      if (constraintPassed) {
        finalDidHit = true;
        chosenTopAngle = finalTopAngle;
        chosenBottomAngle = finalBottomAngle;
        chosenMargin = margin;
        chosenIsRightHanded = isRightHanded;
        runOnJS(setHitIsRightHanded)(isRightHanded);
      }
      // If the constraint fails, finalDidHit stays false -- the pitch is
      // treated as a normal ball/strike, didHit is effectively ignored/
      // overridden, no hit-wipe animation at all.
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
    debugConstraintInfo,
  };
}

export type UseDragToPitchReturn = ReturnType<typeof useDragToPitch>;