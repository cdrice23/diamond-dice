import { useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

type DebugInfo = Record<string, number | boolean | null> | null;

type HitConstraintDebugOverlayProps = {
  debugConstraintInfo: DebugInfo;
};

// TEMPORARY -- visual debug aid for directly validating whether
// targetHandsY genuinely stays within [topThresholdY, bottomThresholdY].
// Mathematically it should be impossible for it to fall outside (it's
// built from a value explicitly clamped into that range before
// interpolating), so this overlay is meant to settle whether the
// reported "sometimes outside the band" is a real calculation bug or a
// difficulty reconciling raw log numbers against what's on screen.
export function HitConstraintDebugOverlay({ debugConstraintInfo }: HitConstraintDebugOverlayProps) {
  const containerRef = useRef<any>(null);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);

  function handleLayout() {
    containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMeasured({ width, height });
    });
  }

  if (!debugConstraintInfo || !measured) {
    return <View ref={containerRef} onLayout={handleLayout} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />;
  }

  const topThresholdY = debugConstraintInfo.topThresholdY as number;
  const bottomThresholdY = debugConstraintInfo.bottomThresholdY as number;
  const targetHandsY = debugConstraintInfo.targetHandsY as number;
  const isRightHanded = debugConstraintInfo.isRightHanded as boolean;
  const passed = debugConstraintInfo.passed as boolean;

  // CONFIRMED mapping: right-handed hands is the RIGHT screen edge,
  // left-handed hands is the LEFT screen edge (opposite of an earlier,
  // incorrect assumption).
  const markerX = isRightHanded ? measured.width : 0;

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Svg width={measured.width} height={measured.height}>
        {/* Top threshold -- green */}
        <Line x1={0} y1={topThresholdY} x2={measured.width} y2={topThresholdY} stroke="#00FF00" strokeWidth={2} strokeDasharray="6,4" />
        <SvgText x={8} y={topThresholdY - 6} fill="#00FF00" fontSize={12}>
          topThresholdY: {topThresholdY.toFixed(0)}
        </SvgText>

        {/* Bottom threshold -- red, different color per request */}
        <Line x1={0} y1={bottomThresholdY} x2={measured.width} y2={bottomThresholdY} stroke="#FF0000" strokeWidth={2} strokeDasharray="6,4" />
        <SvgText x={8} y={bottomThresholdY + 16} fill="#FF0000" fontSize={12}>
          bottomThresholdY: {bottomThresholdY.toFixed(0)}
        </SvgText>

        {/* targetHandsY marker -- yellow if within band, magenta if
            somehow outside it (should never happen, but making it
            visually obvious if it does) */}
        <Circle
          cx={markerX}
          cy={targetHandsY}
          r={8}
          fill={targetHandsY >= topThresholdY && targetHandsY <= bottomThresholdY ? '#FFFF00' : '#FF00FF'}
          stroke="#000000"
          strokeWidth={1}
        />
        <SvgText x={isRightHanded ? markerX - 140 : markerX + 12} y={targetHandsY + 4} fill="#FFFF00" fontSize={12}>
          targetHandsY: {targetHandsY.toFixed(0)} ({passed ? 'PASSED' : 'FAILED'})
        </SvgText>
      </Svg>
    </View>
  );
}