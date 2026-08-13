import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, FeGaussianBlur, Filter, Polygon, Rect } from 'react-native-svg';

type Bounds = { x: number; y: number; width: number; height: number };

type PitcherViewBackgroundProps = {
  strikeZoneBounds: Bounds | null;
  visibility: SharedValue<number>;
  fieldColor: string;
  standsColor: string;
  crowdAccentColors: readonly string[];
};

const STANDS_HEIGHT_RATIO = 0.14;

function generateCrowd(width: number, crowdHeight: number, colors: readonly string[]) {
  let seed = 42;
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const cellWidth = width * 0.06;
  const cellHeight = cellWidth * 0.83;
  const dotRadius = cellWidth * 0.25;

  const dots: { cx: number; cy: number; r: number; color: string }[] = [];
  const cols = Math.ceil(width / cellWidth);
  const rows = Math.ceil(crowdHeight / cellHeight);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const jitterX = (rand() - 0.5) * cellWidth * 0.4;
      const jitterY = (rand() - 0.5) * cellHeight * 0.4;
      const cx = col * cellWidth + cellWidth / 2 + jitterX;
      const cy = row * cellHeight + cellHeight / 2 + jitterY;
      const r = dotRadius + rand() * dotRadius * 0.6;
      const color = colors[Math.floor(rand() * colors.length)];
      dots.push({ cx, cy, r, color });
    }
  }
  return dots;
}

export function PitcherViewBackground({
  strikeZoneBounds,
  visibility,
  fieldColor,
  standsColor,
  crowdAccentColors,
}: PitcherViewBackgroundProps) {
  console.log('[stadium] COMPONENT FUNCTION RUNNING -- is it even being called/mounted');

  const containerRef = useRef<any>(null);
  const [measured, setMeasured] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  function handleContainerLayout() {
    console.log('[stadium] handleContainerLayout CALLED, ref is:', containerRef.current ? 'populated' : 'NULL');
    containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      console.log('[stadium] measureInWindow resolved:', JSON.stringify({ x, y, width, height }));
      setMeasured({ x, y, width, height });
    });
  }

  console.log('[stadium] current render -- strikeZoneBounds:', !!strikeZoneBounds, 'measured:', !!measured);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  const apexOffset = measured ? measured.height * 0.076 : 0;
  const standsHeight = measured ? measured.height * STANDS_HEIGHT_RATIO : 0;
  const apexY = strikeZoneBounds && measured ? strikeZoneBounds.y - measured.y + strikeZoneBounds.height + apexOffset : 0;
  const standsTop = measured ? Math.max(0, apexY - standsHeight) : 0;
  const crowdHeight = standsTop;

  const crowdDots = useMemo(() => {
    if (!measured) return [];
    return generateCrowd(measured.width, crowdHeight, crowdAccentColors);
  }, [measured, crowdHeight, crowdAccentColors]);

  const sceneContent =
    strikeZoneBounds && measured ? (
      (() => {
        const apexX = measured.width / 2;
        const leftAngleRad = (175 * Math.PI) / 180;
        const rightAngleRad = (5 * Math.PI) / 180;
        const lineLength = measured.width;

        const leftEndX = apexX + lineLength * Math.cos(leftAngleRad);
        const leftEndY = apexY + lineLength * Math.sin(leftAngleRad);
        const rightEndX = apexX + lineLength * Math.cos(rightAngleRad);
        const rightEndY = apexY + lineLength * Math.sin(rightAngleRad);

        const fieldPoints = [
          [apexX, apexY],
          [leftEndX, leftEndY],
          [0, measured.height],
          [measured.width, measured.height],
          [rightEndX, rightEndY],
        ]
          .map(([x, y]) => `${x},${y}`)
          .join(' ');

        const plateHalfWidth = strikeZoneBounds.width / 2;
        const plateTopY = apexY;
        const plateSideDrop = measured.height * 0.018;
        const plateTopLeft = [apexX - plateHalfWidth, plateTopY];
        const plateTopRight = [apexX + plateHalfWidth, plateTopY];
        const plateSideLeft = [apexX - plateHalfWidth, plateTopY + plateSideDrop];
        const plateSideRight = [apexX + plateHalfWidth, plateTopY + plateSideDrop];
        const platePointLength = plateHalfWidth / Math.cos(rightAngleRad);
        const platePoint = [
          plateSideLeft[0] + platePointLength * Math.cos(rightAngleRad),
          plateSideLeft[1] + platePointLength * Math.sin(rightAngleRad),
        ];
        const platePoints = [plateTopLeft, plateTopRight, plateSideRight, platePoint, plateSideLeft]
          .map(([x, y]) => `${x},${y}`)
          .join(' ');

        return (
          <Svg width={measured.width} height={measured.height}>
            <Defs>
              <Filter id="sceneBlur" x="-20%" y="-20%" width="140%" height="140%">
                <FeGaussianBlur stdDeviation={8} />
              </Filter>
            </Defs>
            <Rect x={0} y={0} width={measured.width} height={crowdHeight} fill={fieldColor} filter="url(#sceneBlur)" />
            {crowdDots.map((dot, i) => (
              <Circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.color} filter="url(#sceneBlur)" />
            ))}
            <Rect
              x={0}
              y={standsTop}
              width={measured.width}
              height={standsHeight}
              fill={standsColor}
              filter="url(#sceneBlur)"
            />
            <Polygon points={fieldPoints} fill={fieldColor} filter="url(#sceneBlur)" />
            <Polygon points={platePoints} fill={fieldColor} filter="url(#sceneBlur)" />
          </Svg>
        );
      })()
    ) : null;

  return (
    <View
      ref={containerRef}
      onLayout={handleContainerLayout}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, opacityStyle]}>{sceneContent}</Animated.View>
    </View>
  );
}