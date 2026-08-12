import Svg, { Rect } from 'react-native-svg';
import { PIXEL_ICONS, type PixelIconName } from '../pixel-icon-data';

type PixelIconProps = {
  name: PixelIconName;
  size?: number;
  color: string;
};

const ROW_OVERLAP = 1.2;

export function PixelIcon({ name, size = 24, color }: PixelIconProps) {
  const icon = PIXEL_ICONS[name];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${icon.width} ${icon.height}`}>
      {icon.runs.map(([x, y, width], i) => (
        <Rect key={i} x={x} y={y} width={width} height={ROW_OVERLAP} fill={color} />
      ))}
    </Svg>
  );
}