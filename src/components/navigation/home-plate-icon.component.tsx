import Svg, { Polygon } from 'react-native-svg';

type HomePlateIconProps = {
  size?: number;
  showProminentBorder?: boolean;
  borderColor?: string;
  flat?: boolean;
};

const PLATE_POINTS = '10,10 90,10 90,55 50,95 10,55';

export function HomePlateIcon({ size = 40, showProminentBorder = false, borderColor = '#05162A', flat = false }: HomePlateIconProps) {
  const shadowOffset = flat ? 0 : size * 0.06;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${100 + shadowOffset} ${100 + shadowOffset}`}>
      {!flat && (
        <Polygon
          points={PLATE_POINTS}
          fill="#C4C4C4"
          transform={`translate(${shadowOffset}, ${shadowOffset})`}
        />
      )}
      <Polygon
        points={PLATE_POINTS}
        fill="#FFFFFF"
        stroke={showProminentBorder ? borderColor : '#00000022'}
        strokeWidth={showProminentBorder ? 2 : 1.5}
      />
    </Svg>
  );
}