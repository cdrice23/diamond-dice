import { useMemo } from 'react';

type Point = { x: number; y: number };

const APEX: Point = { x: 210, y: 260 };
const LEFT_CORNER: Point = { x: 30, y: 80 };
const RIGHT_CORNER: Point = { x: 390, y: 80 };
const ARC_CONTROL: Point = { x: 210, y: -100 };

const FIELD_PADDING = 8;

const APEX_ROUNDING_RADIUS = 36;

const DIRT_LENGTH_RATIO = 0.55;
const DIRT_APEX_MARGIN = 33;

const GRASS_HEIGHT_RATIO = 0.26;

const BASE_SIZE = 7;

const HOME_PLATE_WIDTH = 14;
const HOME_PLATE_HEIGHT = 12;

const MOUND_RADIUS_RATIO = 0.25;
const RUBBER_VERTICAL_OFFSET_RATIO = 0.3;
const RUBBER_WIDTH_RATIO = 1.2;
const RUBBER_HEIGHT_RATIO = 0.3;

const BASE_CUTOUT_RADIUS_RATIO = 1.8;
const HOME_PLATE_CUTOUT_RADIUS_RATIO = 1.8;

const POSITION_MARKER_RADIUS = 6;
const CORNER_MARKER_OFFSET = 30;
const CORNER_MARKER_VERTICAL_OFFSET = 18;
const CORNER_MARKER_FOUL_LINE_OFFSET = 10;
const CATCHER_OFFSET = 10;

const AVATAR_CORNER_MARKER_OFFSET = 30;
const AVATAR_CORNER_MARKER_VERTICAL_OFFSET = 30;
const AVATAR_CORNER_MARKER_FOUL_LINE_OFFSET = 18;
const AVATAR_CATCHER_OFFSET = 20;
const AVATAR_MIDDLE_INFIELD_VERTICAL_OFFSET = 20;

export const AVATAR_MARKER_WIDTH = 24;
export const AVATAR_MARKER_ASPECT_RATIO = 0.8;
export const AVATAR_MARKER_HEIGHT = AVATAR_MARKER_WIDTH / AVATAR_MARKER_ASPECT_RATIO;
export const AVATAR_MARKER_CORNER_RADIUS = 3;
export const UNDERLINE_MARGIN_TOP = 4;
export const UNDERLINE_HEIGHT = 3;
export const UNDERLINE_CORNER_RADIUS = 1;
export { POSITION_MARKER_RADIUS };

const PITCHER_ROW_GAP = 90;
const PITCHER_SPACING_X = 20;
const PITCHER_SPACING_Y = 20;
const PITCHER_RIGHT_MARGIN = 10;

function normalize(v: Point): Point {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  return { x: v.x / length, y: v.y / length };
}

function quadraticBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function bezierExtremeY(p0: Point, p1: Point, p2: Point): number {
  let minY = Math.min(p0.y, p2.y);
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = quadraticBezierPoint(p0, p1, p2, t);
    if (point.y < minY) minY = point.y;
  }
  return minY;
}

function findRayBezierIntersection(origin: Point, direction: Point, p0: Point, p1: Point, p2: Point): Point {
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

    const distance = Math.sqrt((curvePoint.x - projectedPoint.x) ** 2 + (curvePoint.y - projectedPoint.y) ** 2);

    if (distance < closestDistance && projectionLength > 0) {
      closestDistance = distance;
      closestT = t;
    }
  }

  return quadraticBezierPoint(p0, p1, p2, closestT);
}

function findBoundaryXAtY(targetY: number, left: Point, apex: Point, right: Point): number {
  const steps = 500;
  let closestX = right.x;
  let closestDistance = Infinity;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = quadraticBezierPoint(left, apex, right, t);
    const distance = Math.abs(point.y - targetY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestX = point.x;
    }
  }

  return closestX;
}

function cornerFromApex(outerFrom: Point, outerTo: Point, newApex: Point, ratio: number): Point {
  const dx = outerTo.x - outerFrom.x;
  const dy = outerTo.y - outerFrom.y;
  return { x: newApex.x + dx * ratio, y: newApex.y + dy * ratio };
}

function pointAtDistanceFromApex(apex: Point, target: Point, distance: number): Point {
  const direction = normalize({ x: target.x - apex.x, y: target.y - apex.y });
  return { x: apex.x + direction.x * distance, y: apex.y + direction.y * distance };
}

function baseSquarePoints(center: Point, size: number): string {
  const { x, y } = center;
  return `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`;
}

export function outfielderMarkers(count: number, arcLeft: Point, arcControl: Point, arcRight: Point): Point[] {
  if (count === 0) return [];
  const markers: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : 0.18 + (i / (count - 1)) * (0.82 - 0.18);
    markers.push(quadraticBezierPoint(arcLeft, arcControl, arcRight, t));
  }
  return markers;
}

function pitchersPerRow(fieldRight: number, rowStartX: number): number {
  const availableWidth = fieldRight - PITCHER_RIGHT_MARGIN - rowStartX;
  const fitCount = Math.floor(availableWidth / PITCHER_SPACING_X) + 1;
  return Math.max(1, fitCount);
}

export function pitcherMarkers(
  levels: (number | null)[],
  fieldRight: number,
  rowStartX: number,
  rowY: number
): { level: number | null; point: Point }[] {
  const sorted = [...levels].sort((a, b) => (b ?? 0) - (a ?? 0));
  const perRow = pitchersPerRow(fieldRight, rowStartX);
  return sorted.map((level, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return {
      level,
      point: { x: rowStartX + col * PITCHER_SPACING_X, y: rowY + row * PITCHER_SPACING_Y },
    };
  });
}

export function useDiamondGeometry(viewMode: 'color' | 'avatar') {
  return useMemo(() => {
    const apexLeftPullback = pointAtDistanceFromApex(APEX, LEFT_CORNER, APEX_ROUNDING_RADIUS);
    const apexRightPullback = pointAtDistanceFromApex(APEX, RIGHT_CORNER, APEX_ROUNDING_RADIUS);

    const outerStadiumBounds = `M${apexLeftPullback.x},${apexLeftPullback.y} Q${APEX.x},${APEX.y} ${apexRightPullback.x},${apexRightPullback.y} L${RIGHT_CORNER.x},${RIGHT_CORNER.y} Q${ARC_CONTROL.x},${ARC_CONTROL.y} ${LEFT_CORNER.x},${LEFT_CORNER.y} Z`;

    const fieldLeft = LEFT_CORNER.x;
    const fieldRight = RIGHT_CORNER.x;
    const fieldTop = bezierExtremeY(RIGHT_CORNER, ARC_CONTROL, LEFT_CORNER);
    const fieldBottom = APEX.y;

    const viewBoxMinX = fieldLeft - FIELD_PADDING;
    const viewBoxMinY = fieldTop - FIELD_PADDING;
    const viewBoxWidth = fieldRight - fieldLeft + FIELD_PADDING * 2;
    const viewBoxHeight = fieldBottom - fieldTop + FIELD_PADDING * 2;

    const dirtApex = { x: APEX.x, y: APEX.y - DIRT_APEX_MARGIN };
    const dirtLeftCorner = cornerFromApex(APEX, LEFT_CORNER, dirtApex, DIRT_LENGTH_RATIO);
    const dirtRightCorner = cornerFromApex(APEX, RIGHT_CORNER, dirtApex, DIRT_LENGTH_RATIO);
    const dirtArcControl = { x: 210, y: dirtLeftCorner.y - 100 };

    const infieldDirtBounds = `M${dirtApex.x},${dirtApex.y} L${dirtLeftCorner.x},${dirtLeftCorner.y} Q${dirtArcControl.x},${dirtArcControl.y} ${dirtRightCorner.x},${dirtRightCorner.y} Z`;

    const dirtHeight = dirtApex.y - dirtArcControl.y;
    const grassApexMargin = DIRT_APEX_MARGIN * 0.5;
    const grassRadius = dirtHeight * GRASS_HEIGHT_RATIO;

    const grassApex = { x: APEX.x, y: dirtApex.y - grassApexMargin };
    const grassCenter = { x: grassApex.x, y: grassApex.y - grassRadius };

    const grassLeftCorner = { x: grassCenter.x - grassRadius, y: grassCenter.y };
    const grassRightCorner = { x: grassCenter.x + grassRadius, y: grassCenter.y };
    const grassTop = { x: grassCenter.x, y: grassCenter.y - grassRadius };

    const infieldGrassBounds = `M${grassApex.x},${grassApex.y} L${grassLeftCorner.x},${grassLeftCorner.y} L${grassTop.x},${grassTop.y} L${grassRightCorner.x},${grassRightCorner.y} Z`;

    const firstBaseCenter = { x: grassRightCorner.x - BASE_SIZE, y: grassRightCorner.y };
    const secondBaseCenter = { x: grassTop.x, y: grassTop.y + BASE_SIZE };
    const thirdBaseCenter = { x: grassLeftCorner.x + BASE_SIZE, y: grassLeftCorner.y };

    const firstBasePoints = baseSquarePoints(firstBaseCenter, BASE_SIZE);
    const secondBasePoints = baseSquarePoints(secondBaseCenter, BASE_SIZE);
    const thirdBasePoints = baseSquarePoints(thirdBaseCenter, BASE_SIZE);

    const homePlateBottomY = dirtApex.y - 3;
    const homePlateTopY = homePlateBottomY - HOME_PLATE_HEIGHT;
    const homePlateCenter = { x: APEX.x, y: (homePlateTopY + homePlateBottomY) / 2 };
    const homePlatePoints = [
      `${APEX.x - HOME_PLATE_WIDTH / 2},${homePlateTopY}`,
      `${APEX.x + HOME_PLATE_WIDTH / 2},${homePlateTopY}`,
      `${APEX.x + HOME_PLATE_WIDTH / 2},${homePlateTopY + HOME_PLATE_HEIGHT * 0.6}`,
      `${APEX.x},${homePlateBottomY}`,
      `${APEX.x - HOME_PLATE_WIDTH / 2},${homePlateTopY + HOME_PLATE_HEIGHT * 0.6}`,
    ].join(' ');

    const moundRadius = grassRadius * MOUND_RADIUS_RATIO;
    const moundCenter = { x: grassCenter.x, y: grassCenter.y };

    const rubberVerticalOffset = moundRadius * RUBBER_VERTICAL_OFFSET_RATIO;
    const rubberCenter = { x: moundCenter.x, y: moundCenter.y - rubberVerticalOffset };
    const rubberWidth = BASE_SIZE * RUBBER_WIDTH_RATIO;
    const rubberHeight = BASE_SIZE * RUBBER_HEIGHT_RATIO;

    const foulLineLeftStart = { x: APEX.x - HOME_PLATE_WIDTH / 2, y: homePlateTopY };
    const foulLineRightStart = { x: APEX.x + HOME_PLATE_WIDTH / 2, y: homePlateTopY };

    const outerDirectionLeft = normalize({ x: LEFT_CORNER.x - APEX.x, y: LEFT_CORNER.y - APEX.y });
    const outerDirectionRight = normalize({ x: RIGHT_CORNER.x - APEX.x, y: RIGHT_CORNER.y - APEX.y });

    const foulLineLeftEnd = findRayBezierIntersection(foulLineLeftStart, outerDirectionLeft, LEFT_CORNER, ARC_CONTROL, RIGHT_CORNER);
    const foulLineRightEnd = findRayBezierIntersection(foulLineRightStart, outerDirectionRight, LEFT_CORNER, ARC_CONTROL, RIGHT_CORNER);

    const baseCutoutRadius = BASE_SIZE * BASE_CUTOUT_RADIUS_RATIO;
    const homePlateCutoutRadius = BASE_SIZE * HOME_PLATE_CUTOUT_RADIUS_RATIO;

    const cornerOffset = viewMode === 'avatar' ? AVATAR_CORNER_MARKER_OFFSET : CORNER_MARKER_OFFSET;
    const verticalOffset = viewMode === 'avatar' ? AVATAR_CORNER_MARKER_VERTICAL_OFFSET : CORNER_MARKER_VERTICAL_OFFSET;
    const foulLineOffset = viewMode === 'avatar' ? AVATAR_CORNER_MARKER_FOUL_LINE_OFFSET : CORNER_MARKER_FOUL_LINE_OFFSET;
    const catcherOffset = viewMode === 'avatar' ? AVATAR_CATCHER_OFFSET : CATCHER_OFFSET;
    const middleInfieldVerticalOffset = viewMode === 'avatar' ? AVATAR_MIDDLE_INFIELD_VERTICAL_OFFSET : 0;

    const markers = {
      catcher: { x: APEX.x, y: homePlateBottomY + catcherOffset },
      firstBase: { x: firstBaseCenter.x + foulLineOffset, y: firstBaseCenter.y - verticalOffset },
      thirdBase: { x: thirdBaseCenter.x - foulLineOffset, y: thirdBaseCenter.y - verticalOffset },
      secondBase: { x: secondBaseCenter.x + cornerOffset, y: secondBaseCenter.y - middleInfieldVerticalOffset },
      shortstop: { x: secondBaseCenter.x - cornerOffset, y: secondBaseCenter.y - middleInfieldVerticalOffset },
    };

    const ofArcMargin = 44;
    const ofArcLeft = pointAtDistanceFromApex(APEX, LEFT_CORNER, Math.hypot(LEFT_CORNER.x - APEX.x, LEFT_CORNER.y - APEX.y) - ofArcMargin);
    const ofArcRight = pointAtDistanceFromApex(APEX, RIGHT_CORNER, Math.hypot(RIGHT_CORNER.x - APEX.x, RIGHT_CORNER.y - APEX.y) - ofArcMargin);
    const ofArcControl = { x: ARC_CONTROL.x, y: ARC_CONTROL.y + ofArcMargin * 1.4 };

    // Pitcher row is always positioned off the color-mode catcher marker,
    // regardless of viewMode -- pitchers are never shown in avatar mode
    // (showPitchers=false), so this geometry doesn't need a mode branch.
    const colorCatcherMarker = { x: APEX.x, y: homePlateBottomY + CATCHER_OFFSET };
    const pitcherRowStartX = findBoundaryXAtY(colorCatcherMarker.y, apexLeftPullback, APEX, apexRightPullback) + PITCHER_ROW_GAP;
    const pitcherRowY = colorCatcherMarker.y;

    return {
      viewBox: { minX: viewBoxMinX, minY: viewBoxMinY, width: viewBoxWidth, height: viewBoxHeight },
      outerStadiumBounds,
      infieldDirtBounds,
      infieldGrassBounds,
      firstBasePoints,
      secondBasePoints,
      thirdBasePoints,
      homePlateCenter,
      homePlatePoints,
      moundCenter,
      moundRadius,
      rubberCenter,
      rubberWidth,
      rubberHeight,
      foulLineLeftStart,
      foulLineLeftEnd,
      foulLineRightStart,
      foulLineRightEnd,
      firstBaseCenter,
      secondBaseCenter,
      thirdBaseCenter,
      baseCutoutRadius,
      homePlateCutoutRadius,
      markers,
      ofArcLeft,
      ofArcControl,
      ofArcRight,
      fieldRight,
      pitcherRowStartX,
      pitcherRowY,
    };
  }, [viewMode]);
}