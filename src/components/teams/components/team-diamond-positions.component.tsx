import { adjustHslLightness, levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Line, Mask, Path, Polygon, Rect, Image as SvgImage } from 'react-native-svg';
import {
  AVATAR_MARKER_CORNER_RADIUS,
  AVATAR_MARKER_HEIGHT,
  AVATAR_MARKER_WIDTH,
  POSITION_MARKER_RADIUS,
  UNDERLINE_CORNER_RADIUS,
  UNDERLINE_HEIGHT,
  UNDERLINE_MARGIN_TOP,
  outfielderMarkers,
  pitcherMarkers,
  useDiamondGeometry
} from '../hooks/use-diamond-geometry.hook';
import { PositionLevels } from '../teams.types';

const POSITION_MARKER_STROKE_WIDTH = 0;

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

export type PositionPlayerRef = {
  id: string;
  image_url: string | null;
};

function renderAvatarMarker(
  point: { x: number; y: number },
  level: number | null,
  playerRef: PositionPlayerRef | null,
  colors: ReturnType<typeof useTheme>['colors'],
  key: string
) {
  const clipId = `avatar-clip-${key}`;
  const hasImage = Boolean(playerRef?.image_url);
  const x = point.x - AVATAR_MARKER_WIDTH / 2;
  const y = point.y - AVATAR_MARKER_HEIGHT / 2;
  const underlineY = y + AVATAR_MARKER_HEIGHT + UNDERLINE_MARGIN_TOP;

  if (!hasImage) {
    return (
      <React.Fragment key={key}>
        <Rect x={x} y={y} width={AVATAR_MARKER_WIDTH} height={AVATAR_MARKER_HEIGHT} rx={AVATAR_MARKER_CORNER_RADIUS} fill={colors.muted} />
        <Rect
          x={x}
          y={underlineY}
          width={AVATAR_MARKER_WIDTH}
          height={UNDERLINE_HEIGHT}
          rx={UNDERLINE_CORNER_RADIUS}
          fill={levelColor(level, colors)}
        />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment key={key}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={x} y={y} width={AVATAR_MARKER_WIDTH} height={AVATAR_MARKER_HEIGHT} rx={AVATAR_MARKER_CORNER_RADIUS} />
        </ClipPath>
      </Defs>
      <SvgImage
        x={x}
        y={y}
        width={AVATAR_MARKER_WIDTH}
        height={AVATAR_MARKER_HEIGHT}
        href={{ uri: playerRef!.image_url! }}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
      <Rect
        x={x}
        y={underlineY}
        width={AVATAR_MARKER_WIDTH}
        height={UNDERLINE_HEIGHT}
        rx={UNDERLINE_CORNER_RADIUS}
        fill={levelColor(level, colors)}
      />
    </React.Fragment>
  );
}

type TeamDiamondPositionsProps = {
  positions: PositionLevels;
  pitcherLevels: (number | null)[];
  width: number;
  viewMode?: 'color' | 'avatar';
  showPitchers?: boolean;
  positionPlayerRefs?: {
    C: PositionPlayerRef | null;
    '1B': PositionPlayerRef | null;
    '2B': PositionPlayerRef | null;
    SS: PositionPlayerRef | null;
    '3B': PositionPlayerRef | null;
    OF: (PositionPlayerRef | null)[];
  };
};

export const TeamDiamondPositions = memo(function TeamDiamondPositions({
  positions,
  pitcherLevels,
  width,
  viewMode = 'color',
  showPitchers = true,
  positionPlayerRefs,
}: TeamDiamondPositionsProps) {
  const { colors, colorScheme } = useTheme();
  const geometry = useDiamondGeometry(viewMode);
  const dirtColor = adjustHslLightness(colors.muted, colorScheme === 'dark' ? 12 : -18);

  const outfielders = useMemo(
    () => outfielderMarkers(positions.OF.length, geometry.ofArcLeft, geometry.ofArcControl, geometry.ofArcRight),
    [positions.OF.length, geometry.ofArcLeft, geometry.ofArcControl, geometry.ofArcRight]
  );
  const pitchers = useMemo(
    () => pitcherMarkers(pitcherLevels, geometry.fieldRight, geometry.pitcherRowStartX, geometry.pitcherRowY),
    [pitcherLevels, geometry.fieldRight, geometry.pitcherRowStartX, geometry.pitcherRowY]
  );

  function renderMarker(
    point: { x: number; y: number },
    level: number | null,
    playerRef: PositionPlayerRef | null,
    key: string
  ) {
    return viewMode === 'avatar'
      ? renderAvatarMarker(point, level, playerRef, colors, key)
      : renderPositionMarker(point, level, colors, key);
  }

  const { viewBox, markers } = geometry;

  return (
    <View style={{ width, aspectRatio: viewBox.width / viewBox.height }}>
      <Svg width="100%" height="100%" viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}>
        <Defs>
          <Mask id="grassMask">
            <Rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="white" />
            <Circle cx={geometry.firstBaseCenter.x} cy={geometry.firstBaseCenter.y} r={geometry.baseCutoutRadius} fill="black" />
            <Circle cx={geometry.secondBaseCenter.x} cy={geometry.secondBaseCenter.y} r={geometry.baseCutoutRadius} fill="black" />
            <Circle cx={geometry.thirdBaseCenter.x} cy={geometry.thirdBaseCenter.y} r={geometry.baseCutoutRadius} fill="black" />
            <Circle cx={geometry.homePlateCenter.x} cy={geometry.homePlateCenter.y} r={geometry.homePlateCutoutRadius} fill="black" />
          </Mask>
        </Defs>

        <Path d={geometry.outerStadiumBounds} fill={colors.muted} />
        <Path d={geometry.infieldDirtBounds} fill={dirtColor} />
        <Circle cx={geometry.homePlateCenter.x} cy={geometry.homePlateCenter.y} r={geometry.homePlateCutoutRadius} fill={dirtColor} />
        <Path d={geometry.infieldGrassBounds} fill={colors.muted} mask="url(#grassMask)" />

        <Line x1={geometry.foulLineLeftStart.x} y1={geometry.foulLineLeftStart.y} x2={geometry.foulLineLeftEnd.x} y2={geometry.foulLineLeftEnd.y} stroke={colors.primary} strokeWidth={1} />
        <Line x1={geometry.foulLineRightStart.x} y1={geometry.foulLineRightStart.y} x2={geometry.foulLineRightEnd.x} y2={geometry.foulLineRightEnd.y} stroke={colors.primary} strokeWidth={1} />

        <Circle cx={geometry.moundCenter.x} cy={geometry.moundCenter.y} r={geometry.moundRadius} fill={dirtColor} />
        <Rect
          x={geometry.rubberCenter.x - geometry.rubberWidth / 2}
          y={geometry.rubberCenter.y - geometry.rubberHeight / 2}
          width={geometry.rubberWidth}
          height={geometry.rubberHeight}
          rx={1}
          fill={colors.primary}
        />

        <Polygon points={geometry.firstBasePoints} fill={colors.primary} />
        <Polygon points={geometry.secondBasePoints} fill={colors.primary} />
        <Polygon points={geometry.thirdBasePoints} fill={colors.primary} />
        <Polygon points={geometry.homePlatePoints} fill={colors.primary} />

        {renderMarker(markers.catcher, positions.C, positionPlayerRefs?.C ?? null, 'c')}
        {renderMarker(markers.firstBase, positions['1B'], positionPlayerRefs?.['1B'] ?? null, '1b')}
        {renderMarker(markers.secondBase, positions['2B'], positionPlayerRefs?.['2B'] ?? null, '2b')}
        {renderMarker(markers.shortstop, positions.SS, positionPlayerRefs?.SS ?? null, 'ss')}
        {renderMarker(markers.thirdBase, positions['3B'], positionPlayerRefs?.['3B'] ?? null, '3b')}
        {outfielders.map((point, i) => renderMarker(point, positions.OF[i], positionPlayerRefs?.OF[i] ?? null, `of-${i}`))}
        {showPitchers && pitchers.map(({ point, level }, i) => renderPositionMarker(point, level, colors, `p-${i}`))}
      </Svg>
    </View>
  );
});