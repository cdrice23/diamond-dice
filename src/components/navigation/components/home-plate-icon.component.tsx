import Svg, { Polygon } from 'react-native-svg';

type HomePlateIconProps = {
  size?: number;
  showProminentBorder?: boolean;
  pressedStrokeColor?: string;
  flat?: boolean;
};

const OUTER = [
  [10, 10],
  [90, 10],
  [90, 55],
  [50, 95],
  [10, 55],
] as const;

const INNER = [
  [17.2, 16.3],
  [82.8, 16.3],
  [82.8, 53.2],
  [50, 86],
  [17.2, 53.2],
] as const;

function pointsToString(pts: readonly (readonly [number, number])[]) {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

const FACETS: { points: readonly (readonly [number, number])[]; shade: 'light' | 'dark' }[] = [
  { points: [OUTER[0], OUTER[1], INNER[1], INNER[0]], shade: 'light' },
  { points: [OUTER[1], OUTER[2], INNER[2], INNER[1]], shade: 'dark' }, 
  { points: [OUTER[2], OUTER[3], INNER[3], INNER[2]], shade: 'dark' },  
  { points: [OUTER[3], OUTER[4], INNER[4], INNER[3]], shade: 'dark' },  
  { points: [OUTER[4], OUTER[0], INNER[0], INNER[4]], shade: 'light' }, 
];

const LIGHT_SHADE = '#EDEDED';
const DARK_SHADE = '#B8B8B8';

function facetFill(shade: 'light' | 'dark', flat: boolean) {
  const effectiveShade = flat ? (shade === 'light' ? 'dark' : 'light') : shade;
  return effectiveShade === 'light' ? LIGHT_SHADE : DARK_SHADE;
}

export function HomePlateIcon({
  size = 40,
  showProminentBorder = false,
  pressedStrokeColor = '#EDEDED',
  flat = false,
}: HomePlateIconProps) {
  const stroke = flat ? pressedStrokeColor : '#B8B8B8' ;
  const strokeWidth = flat ? 1 : showProminentBorder ? 1 : 0.5;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {FACETS.map((facet, i) => (
        <Polygon
          key={i}
          points={pointsToString(facet.points)}
          fill={facetFill(facet.shade, flat)}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
      <Polygon points={pointsToString(INNER)} fill="#F7F7F7" />
    </Svg>
  );
}