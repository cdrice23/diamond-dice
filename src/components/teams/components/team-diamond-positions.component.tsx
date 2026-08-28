import { adjustHslLightness } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Mask, Path, Polygon, Rect } from 'react-native-svg';
import { PositionLevels } from '../teams.types';

function bezierExtremeY(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
  let minY = Math.min(p0.y, p2.y);
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = quadraticBezierPoint(p0, p1, p2, t);
    if (point.y < minY) minY = point.y;
  }
  return minY;
}

const APEX = { x: 210, y: 260 };
const LEFT_CORNER = { x: 30, y: 80 };
const RIGHT_CORNER = { x: 390, y: 80 };
const ARC_CONTROL = { x: 210, y: -100 };

const FIELD_PADDING = 8;

const FIELD_LEFT = LEFT_CORNER.x;
const FIELD_RIGHT = RIGHT_CORNER.x;
const FIELD_TOP = bezierExtremeY(RIGHT_CORNER, ARC_CONTROL, LEFT_CORNER);
const FIELD_BOTTOM = APEX.y;

const VIEWBOX_MIN_X = FIELD_LEFT - FIELD_PADDING;
const VIEWBOX_MIN_Y = FIELD_TOP - FIELD_PADDING;
const VIEWBOX_WIDTH = FIELD_RIGHT - FIELD_LEFT + FIELD_PADDING * 2;
const VIEWBOX_HEIGHT = FIELD_BOTTOM - FIELD_TOP + FIELD_PADDING * 2;

const APEX_ROUNDING_RADIUS = 36;
const APEX_LEFT_PULLBACK = pointAtDistanceFromApex(LEFT_CORNER, APEX_ROUNDING_RADIUS);
const APEX_RIGHT_PULLBACK = pointAtDistanceFromApex(RIGHT_CORNER, APEX_ROUNDING_RADIUS);

const OUTER_STADIUM_BOUNDS = `M${APEX_LEFT_PULLBACK.x},${APEX_LEFT_PULLBACK.y} Q${APEX.x},${APEX.y} ${APEX_RIGHT_PULLBACK.x},${APEX_RIGHT_PULLBACK.y} L${RIGHT_CORNER.x},${RIGHT_CORNER.y} Q${ARC_CONTROL.x},${ARC_CONTROL.y} ${LEFT_CORNER.x},${LEFT_CORNER.y} Z`;

function cornerFromApex(
  outerFrom: { x: number; y: number },
  outerTo: { x: number; y: number },
  newApex: { x: number; y: number },
  ratio: number
) {
  const dx = outerTo.x - outerFrom.x;
  const dy = outerTo.y - outerFrom.y;
  return { x: newApex.x + dx * ratio, y: newApex.y + dy * ratio };
}

function pointAtDistanceFromApex(target: { x: number; y: number }, distance: number) {
  const direction = normalize({ x: target.x - APEX.x, y: target.y - APEX.y });
  return { x: APEX.x + direction.x * distance, y: APEX.y + direction.y * distance };
}

function normalize(v: { x: number; y: number }) {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  return { x: v.x / length, y: v.y / length };
}

function quadraticBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function findRayBezierIntersection(
  origin: { x: number; y: number },
  direction: { x: number; y: number },
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) {
  let closestT = 0;
  let closestDistance = Infinity;

  for (let i = 0; i <= 1000; i++) {
    const t = i / 1000;
    const curvePoint = quadraticBezierPoint(p0, p1, p2, t);

    const toCurve = { x: curvePoint.x - origin.x, y: curvePoint.y - origin.y };
    const projectionLength = toCurve.x * direction.x + toCurve.y * direction.y;
    const projectedPoint = {
      x: origin.x + direction.x * projectionLength,
      y: origin.y + direction.y * projectionLength,
    };

    const distance = Math.sqrt(
      (curvePoint.x - projectedPoint.x) ** 2 + (curvePoint.y - projectedPoint.y) ** 2
    );

    if (distance < closestDistance && projectionLength > 0) {
      closestDistance = distance;
      closestT = t;
    }
  }

  return quadraticBezierPoint(p0, p1, p2, closestT);
}

function findBoundaryXAtY(targetY: number) {
  const steps = 500;
  let closestX = APEX_RIGHT_PULLBACK.x;
  let closestDistance = Infinity;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = quadraticBezierPoint(APEX_LEFT_PULLBACK, APEX, APEX_RIGHT_PULLBACK, t);
    const distance = Math.abs(point.y - targetY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestX = point.x;
    }
  }

  return closestX;
}

const DIRT_LENGTH_RATIO = 0.55;
const DIRT_APEX_MARGIN = 33;

const DIRT_APEX = { x: APEX.x, y: APEX.y - DIRT_APEX_MARGIN };
const DIRT_LEFT_CORNER = cornerFromApex(APEX, LEFT_CORNER, DIRT_APEX, DIRT_LENGTH_RATIO);
const DIRT_RIGHT_CORNER = cornerFromApex(APEX, RIGHT_CORNER, DIRT_APEX, DIRT_LENGTH_RATIO);
const DIRT_ARC_CONTROL = { x: 210, y: DIRT_LEFT_CORNER.y - 100 };

const INFIELD_DIRT_BOUNDS = `M${DIRT_APEX.x},${DIRT_APEX.y} L${DIRT_LEFT_CORNER.x},${DIRT_LEFT_CORNER.y} Q${DIRT_ARC_CONTROL.x},${DIRT_ARC_CONTROL.y} ${DIRT_RIGHT_CORNER.x},${DIRT_RIGHT_CORNER.y} Z`;

const GRASS_HEIGHT_RATIO = 0.26;
const GRASS_APEX_MARGIN = DIRT_APEX_MARGIN * 0.5;

const DIRT_HEIGHT = DIRT_APEX.y - DIRT_ARC_CONTROL.y;
const GRASS_RADIUS = DIRT_HEIGHT * GRASS_HEIGHT_RATIO;

const GRASS_APEX = { x: APEX.x, y: DIRT_APEX.y - GRASS_APEX_MARGIN };
const GRASS_CENTER = { x: GRASS_APEX.x, y: GRASS_APEX.y - GRASS_RADIUS };

const GRASS_LEFT_CORNER = { x: GRASS_CENTER.x - GRASS_RADIUS, y: GRASS_CENTER.y };
const GRASS_RIGHT_CORNER = { x: GRASS_CENTER.x + GRASS_RADIUS, y: GRASS_CENTER.y };
const GRASS_TOP = { x: GRASS_CENTER.x, y: GRASS_CENTER.y - GRASS_RADIUS };

const INFIELD_GRASS_BOUNDS = `M${GRASS_APEX.x},${GRASS_APEX.y} L${GRASS_LEFT_CORNER.x},${GRASS_LEFT_CORNER.y} L${GRASS_TOP.x},${GRASS_TOP.y} L${GRASS_RIGHT_CORNER.x},${GRASS_RIGHT_CORNER.y} Z`;

const BASE_SIZE = 7;

function baseSquarePoints(center: { x: number; y: number }, size: number) {
  const { x, y } = center;
  return `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`;
}

const FIRST_BASE_CENTER = { x: GRASS_RIGHT_CORNER.x - BASE_SIZE, y: GRASS_RIGHT_CORNER.y };
const SECOND_BASE_CENTER = { x: GRASS_TOP.x, y: GRASS_TOP.y + BASE_SIZE };
const THIRD_BASE_CENTER = { x: GRASS_LEFT_CORNER.x + BASE_SIZE, y: GRASS_LEFT_CORNER.y };

const FIRST_BASE_POINTS = baseSquarePoints(FIRST_BASE_CENTER, BASE_SIZE);
const SECOND_BASE_POINTS = baseSquarePoints(SECOND_BASE_CENTER, BASE_SIZE);
const THIRD_BASE_POINTS = baseSquarePoints(THIRD_BASE_CENTER, BASE_SIZE);

const HOME_PLATE_BOTTOM_Y = DIRT_APEX.y - 3;
const HOME_PLATE_WIDTH = 14;
const HOME_PLATE_HEIGHT = 12;
const HOME_PLATE_TOP_Y = HOME_PLATE_BOTTOM_Y - HOME_PLATE_HEIGHT;
const HOME_PLATE_CENTER = { x: APEX.x, y: (HOME_PLATE_TOP_Y + HOME_PLATE_BOTTOM_Y) / 2 };
const HOME_PLATE_POINTS = [
  `${APEX.x - HOME_PLATE_WIDTH / 2},${HOME_PLATE_TOP_Y}`,
  `${APEX.x + HOME_PLATE_WIDTH / 2},${HOME_PLATE_TOP_Y}`,
  `${APEX.x + HOME_PLATE_WIDTH / 2},${HOME_PLATE_TOP_Y + HOME_PLATE_HEIGHT * 0.6}`,
  `${APEX.x},${HOME_PLATE_BOTTOM_Y}`,
  `${APEX.x - HOME_PLATE_WIDTH / 2},${HOME_PLATE_TOP_Y + HOME_PLATE_HEIGHT * 0.6}`,
].join(' ');

const MOUND_RADIUS = GRASS_RADIUS * 0.25;
const MOUND_CENTER = { x: GRASS_CENTER.x, y: GRASS_CENTER.y };

const RUBBER_VERTICAL_OFFSET = MOUND_RADIUS * 0.3;
const RUBBER_CENTER = { x: MOUND_CENTER.x, y: MOUND_CENTER.y - RUBBER_VERTICAL_OFFSET };

const RUBBER_WIDTH = BASE_SIZE * 1.2;
const RUBBER_HEIGHT = BASE_SIZE * 0.3;

const FOUL_LINE_LEFT_START = { x: APEX.x - HOME_PLATE_WIDTH / 2, y: HOME_PLATE_TOP_Y };
const FOUL_LINE_RIGHT_START = { x: APEX.x + HOME_PLATE_WIDTH / 2, y: HOME_PLATE_TOP_Y };

const OUTER_DIRECTION_LEFT = normalize({ x: LEFT_CORNER.x - APEX.x, y: LEFT_CORNER.y - APEX.y });
const OUTER_DIRECTION_RIGHT = normalize({ x: RIGHT_CORNER.x - APEX.x, y: RIGHT_CORNER.y - APEX.y });

const BASE_CUTOUT_RADIUS = BASE_SIZE * 1.8;
const HOME_PLATE_CUTOUT_RADIUS = BASE_SIZE * 1.8;

const FOUL_LINE_LEFT_END = findRayBezierIntersection(
  FOUL_LINE_LEFT_START,
  OUTER_DIRECTION_LEFT,
  LEFT_CORNER,
  ARC_CONTROL,
  RIGHT_CORNER
);

const FOUL_LINE_RIGHT_END = findRayBezierIntersection(
  FOUL_LINE_RIGHT_START,
  OUTER_DIRECTION_RIGHT,
  LEFT_CORNER,
  ARC_CONTROL,
  RIGHT_CORNER
);

const POSITION_MARKER_RADIUS = 6;
const POSITION_MARKER_STROKE_WIDTH = 0;
const CORNER_MARKER_OFFSET = 30;
const CORNER_MARKER_VERTICAL_OFFSET = 18;
const CORNER_MARKER_FOUL_LINE_OFFSET = 10;

const CATCHER_MARKER = { x: APEX.x, y: HOME_PLATE_BOTTOM_Y + 10 };
const FIRST_BASE_MARKER = {
  x: FIRST_BASE_CENTER.x + CORNER_MARKER_FOUL_LINE_OFFSET,
  y: FIRST_BASE_CENTER.y - CORNER_MARKER_VERTICAL_OFFSET,
};
const THIRD_BASE_MARKER = {
  x: THIRD_BASE_CENTER.x - CORNER_MARKER_FOUL_LINE_OFFSET,
  y: THIRD_BASE_CENTER.y - CORNER_MARKER_VERTICAL_OFFSET,
};
const SECOND_BASE_MARKER = { x: SECOND_BASE_CENTER.x + CORNER_MARKER_OFFSET, y: SECOND_BASE_CENTER.y };
const SHORTSTOP_MARKER = { x: SECOND_BASE_CENTER.x - CORNER_MARKER_OFFSET, y: SECOND_BASE_CENTER.y };

const OF_ARC_MARGIN = 44;
const OF_ARC_LEFT = pointAtDistanceFromApex(LEFT_CORNER, Math.hypot(LEFT_CORNER.x - APEX.x, LEFT_CORNER.y - APEX.y) - OF_ARC_MARGIN);
const OF_ARC_RIGHT = pointAtDistanceFromApex(RIGHT_CORNER, Math.hypot(RIGHT_CORNER.x - APEX.x, RIGHT_CORNER.y - APEX.y) - OF_ARC_MARGIN);
const OF_ARC_CONTROL = { x: ARC_CONTROL.x, y: ARC_CONTROL.y + OF_ARC_MARGIN * 1.4 };

function outfielderMarkers(count: number) {
  if (count === 0) return [];
  const markers = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : 0.18 + (i / (count - 1)) * (0.82 - 0.18);
    markers.push(quadraticBezierPoint(OF_ARC_LEFT, OF_ARC_CONTROL, OF_ARC_RIGHT, t));
  }
  return markers;
}

function levelColor(level: number | null, colors: ReturnType<typeof useTheme>['colors']) {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

const PITCHER_ROW_GAP = 90;
const PITCHER_ROW_START_X = findBoundaryXAtY(CATCHER_MARKER.y) + PITCHER_ROW_GAP;
const PITCHER_ROW_Y = CATCHER_MARKER.y;
const PITCHER_SPACING_X = 20;
const PITCHER_SPACING_Y = 20;
const PITCHER_RIGHT_MARGIN = 10;

function pitchersPerRow() {
  const availableWidth = FIELD_RIGHT - PITCHER_RIGHT_MARGIN - PITCHER_ROW_START_X;
  const fitCount = Math.floor(availableWidth / PITCHER_SPACING_X) + 1;
  return Math.max(1, fitCount);
}

function pitcherMarkers(levels: (number | null)[]) {
  const sorted = [...levels].sort((a, b) => (b ?? 0) - (a ?? 0));
  const perRow = pitchersPerRow();
  return sorted.map((level, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return {
      level,
      point: {
        x: PITCHER_ROW_START_X + col * PITCHER_SPACING_X,
        y: PITCHER_ROW_Y + row * PITCHER_SPACING_Y,
      },
    };
  });
}

function renderPositionMarker(
  point: { x: number; y: number },
  level: number | null,
  colors: ReturnType<typeof useTheme>['colors'],
  key: string
) {
  return (
    <Circle
      key={key}
      cx={point.x}
      cy={point.y}
      r={POSITION_MARKER_RADIUS}
      fill={levelColor(level, colors)}
      stroke={colors.primary}
      strokeWidth={POSITION_MARKER_STROKE_WIDTH}
    />
  );
}

type TeamDiamondPositionsProps = {
  positions: PositionLevels;
  pitcherLevels: (number | null)[];
  width: number;
};

export const TeamDiamondPositions = memo(function TeamDiamondPositions({
  positions,
  pitcherLevels,
  width,
}: TeamDiamondPositionsProps) {
  const { colors, colorScheme } = useTheme();
  const dirtColor = adjustHslLightness(colors.muted, colorScheme === 'dark' ? 12 : -18);

  const outfielders = useMemo(() => outfielderMarkers(positions.OF.length), [positions.OF.length]);
  const pitchers = useMemo(() => pitcherMarkers(pitcherLevels), [pitcherLevels]);

  return (
    <View style={{ width, aspectRatio: VIEWBOX_WIDTH / VIEWBOX_HEIGHT }}>
      <Svg width="100%" height="100%" viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Defs>
          <Mask id="grassMask">
            <Rect x={VIEWBOX_MIN_X} y={VIEWBOX_MIN_Y} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="white" />
            <Circle cx={FIRST_BASE_CENTER.x} cy={FIRST_BASE_CENTER.y} r={BASE_CUTOUT_RADIUS} fill="black" />
            <Circle cx={SECOND_BASE_CENTER.x} cy={SECOND_BASE_CENTER.y} r={BASE_CUTOUT_RADIUS} fill="black" />
            <Circle cx={THIRD_BASE_CENTER.x} cy={THIRD_BASE_CENTER.y} r={BASE_CUTOUT_RADIUS} fill="black" />
            <Circle cx={HOME_PLATE_CENTER.x} cy={HOME_PLATE_CENTER.y} r={HOME_PLATE_CUTOUT_RADIUS} fill="black" />
          </Mask>
        </Defs>

        <Path d={OUTER_STADIUM_BOUNDS} fill={colors.muted} />
        <Path d={INFIELD_DIRT_BOUNDS} fill={dirtColor} />
        <Circle cx={HOME_PLATE_CENTER.x} cy={HOME_PLATE_CENTER.y} r={HOME_PLATE_CUTOUT_RADIUS} fill={dirtColor} />
        <Path d={INFIELD_GRASS_BOUNDS} fill={colors.muted} mask="url(#grassMask)" />

        <Line x1={FOUL_LINE_LEFT_START.x} y1={FOUL_LINE_LEFT_START.y} x2={FOUL_LINE_LEFT_END.x} y2={FOUL_LINE_LEFT_END.y} stroke={colors.primary} strokeWidth={1} />
        <Line x1={FOUL_LINE_RIGHT_START.x} y1={FOUL_LINE_RIGHT_START.y} x2={FOUL_LINE_RIGHT_END.x} y2={FOUL_LINE_RIGHT_END.y} stroke={colors.primary} strokeWidth={1} />

        <Circle cx={MOUND_CENTER.x} cy={MOUND_CENTER.y} r={MOUND_RADIUS} fill={dirtColor} />
        <Rect
          x={RUBBER_CENTER.x - RUBBER_WIDTH / 2}
          y={RUBBER_CENTER.y - RUBBER_HEIGHT / 2}
          width={RUBBER_WIDTH}
          height={RUBBER_HEIGHT}
          rx={1}
          fill={colors.primary}
        />

        <Polygon points={FIRST_BASE_POINTS} fill={colors.primary} />
        <Polygon points={SECOND_BASE_POINTS} fill={colors.primary} />
        <Polygon points={THIRD_BASE_POINTS} fill={colors.primary} />
        <Polygon points={HOME_PLATE_POINTS} fill={colors.primary} />

        {renderPositionMarker(CATCHER_MARKER, positions.C, colors, 'c')}
        {renderPositionMarker(FIRST_BASE_MARKER, positions['1B'], colors, '1b')}
        {renderPositionMarker(SECOND_BASE_MARKER, positions['2B'], colors, '2b')}
        {renderPositionMarker(SHORTSTOP_MARKER, positions.SS, colors, 'ss')}
        {renderPositionMarker(THIRD_BASE_MARKER, positions['3B'], colors, '3b')}
        {outfielders.map((point, i) => renderPositionMarker(point, positions.OF[i], colors, `of-${i}`))}
        {pitchers.map(({ point, level }, i) => renderPositionMarker(point, level, colors, `p-${i}`))}
      </Svg>
    </View>
  );
});