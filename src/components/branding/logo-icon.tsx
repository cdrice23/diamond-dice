import Svg, { Line, Polygon, Rect } from "react-native-svg";
import { LOGO_COLOR_DEFAULT_MAIN, LOGO_CUBE_LINES, LOGO_CUBE_POLYGON_POINTS, LOGO_ICON_VIEWBOX, LOGO_SIZE, LOGO_SQUARE_RECT, LOGO_STROKE_WIDTH_CUBE, LOGO_STROKE_WIDTH_SQUARE } from "./constants";

type LogoIconProps = {
  size?: number;
  symbolSquareColor?: string;
  symbolCubeColor?: string;
};

export function LogoIcon({ size = LOGO_SIZE, symbolSquareColor = LOGO_COLOR_DEFAULT_MAIN, symbolCubeColor = LOGO_COLOR_DEFAULT_MAIN }: LogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox={LOGO_ICON_VIEWBOX}>
      <Rect x={LOGO_SQUARE_RECT.x} y={LOGO_SQUARE_RECT.y} width={LOGO_SQUARE_RECT.width} height={LOGO_SQUARE_RECT.height} fill="none" stroke={symbolSquareColor} strokeWidth={LOGO_STROKE_WIDTH_SQUARE} />
      <Polygon points={LOGO_CUBE_POLYGON_POINTS} fill="none" stroke={symbolCubeColor} strokeWidth={LOGO_STROKE_WIDTH_CUBE} />
      <Line {...LOGO_CUBE_LINES[0]} stroke={symbolCubeColor} strokeWidth={LOGO_STROKE_WIDTH_CUBE} />
      <Line {...LOGO_CUBE_LINES[1]} stroke={symbolCubeColor} strokeWidth={LOGO_STROKE_WIDTH_CUBE} />
      <Line {...LOGO_CUBE_LINES[2]} stroke={symbolCubeColor} strokeWidth={LOGO_STROKE_WIDTH_CUBE} />
    </Svg>
  );
}