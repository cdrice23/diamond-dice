// components/LogoIcon.tsx
import Svg, { Line, Polygon, Rect } from "react-native-svg";

type LogoIconProps = {
  size?: number;
  symbolSquareColor?: string;
  symbolCubeColor?: string;
};

export function LogoIcon({ size = 100, symbolSquareColor = "#000000", symbolCubeColor = "#000000" }: LogoIconProps) {
  const strokeWidthSquare = 8
  const strokeWidthCube = 8

  return (
    <Svg width={size} height={size} viewBox="0 0 327.5 377.8">
      <Rect x="33.75" y="58.9" width="260" height="260" fill="none" stroke={symbolSquareColor} strokeWidth={strokeWidthSquare} />
      <Polygon points="163.75,1.25 326.25,95.1 326.25,282.7 163.75,376.55 1.25,282.7 1.25,95.1" fill="none" stroke={symbolCubeColor} strokeWidth={strokeWidthCube} />
      <Line x1="163.75" y1="188.9" x2="163.75" y2="1.25" stroke={symbolCubeColor} strokeWidth={strokeWidthCube} />
      <Line x1="163.75" y1="188.9" x2="326.25" y2="282.7" stroke={symbolCubeColor} strokeWidth={strokeWidthCube} />
      <Line x1="163.75" y1="188.9" x2="1.25" y2="282.7" stroke={symbolCubeColor} strokeWidth={strokeWidthCube} />
    </Svg>
  );
}