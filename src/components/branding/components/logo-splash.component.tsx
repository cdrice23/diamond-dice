import { Text, useWindowDimensions, View } from "react-native";
import {
  BASE_CONTENT_WIDTH,
  BASE_FONT_SIZE,
  HORIZONTAL_PADDING,
  LOGO_COLOR_DEFAULT_ACCENT,
  LOGO_COLOR_DEFAULT_MAIN,
  LOGO_SPLASH_FONT_FAMILY,
  SUBTITLE_ACCENT_LINE_GAP,
  SUBTITLE_ACCENT_LONG_WIDTH,
  SUBTITLE_ACCENT_MARGIN,
  SUBTITLE_ACCENT_SHORT_WIDTH,
  SUBTITLE_ACCENT_THICKNESS,
  SUBTITLE_ACCENT_VERTICAL_OFFSET,
  SUBTITLE_FONT_FAMILY,
  SUBTITLE_LETTER_SPACING,
  SUBTITLE_MARGIN_TOP,
  SUBTITLE_SCALE_RATIO,
} from "../branding.constants";
import { LogoIcon } from "./logo-icon.component";

type LogoSplashProps = {
  mainColor?: string;
  accentColor?: string;
  symbolSquareColor?: string;
  symbolCubeColor?: string;
  subtitleColor?: string;
  fontFamily?: string;
};

function AccentLines({
  color,
  longWidth,
  shortWidth,
  thickness,
  lineGap,
  align,
  verticalOffset,
}: {
  color: string;
  longWidth: number;
  shortWidth: number;
  thickness: number;
  lineGap: number;
  align: "flex-start" | "flex-end";
  verticalOffset : number,
}) {
  return (
    <View style={{ alignItems: align, gap: lineGap, marginTop: verticalOffset }}>
      <View style={{ width: longWidth, height: thickness, backgroundColor: color }} />
      <View style={{ width: shortWidth, height: thickness, backgroundColor: color }} />
    </View>
  );
}

export function LogoSplash({
  mainColor = LOGO_COLOR_DEFAULT_MAIN,
  accentColor = LOGO_COLOR_DEFAULT_ACCENT,
  symbolSquareColor = LOGO_COLOR_DEFAULT_MAIN,
  symbolCubeColor = LOGO_COLOR_DEFAULT_MAIN,
  subtitleColor = LOGO_COLOR_DEFAULT_MAIN,
  fontFamily = LOGO_SPLASH_FONT_FAMILY,
}: LogoSplashProps) {
  const { width: screenWidth } = useWindowDimensions();
  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const scale = Math.min(1, availableWidth / BASE_CONTENT_WIDTH);
  const fontSize = BASE_FONT_SIZE * scale;
  const gap = 4 * scale;

  const textStyle = { fontFamily, fontSize };
  const subtitleStyle = {
    fontFamily: SUBTITLE_FONT_FAMILY,
    fontSize: fontSize * SUBTITLE_SCALE_RATIO,
    letterSpacing: SUBTITLE_LETTER_SPACING * scale,
    color: subtitleColor,
    marginTop: SUBTITLE_MARGIN_TOP * scale
  };

  const accentProps = {
    color: subtitleColor,
    longWidth: SUBTITLE_ACCENT_LONG_WIDTH * scale,
    shortWidth: SUBTITLE_ACCENT_SHORT_WIDTH * scale,
    thickness: Math.max(1, SUBTITLE_ACCENT_THICKNESS * scale),
    lineGap: SUBTITLE_ACCENT_LINE_GAP * scale,
    verticalOffset: SUBTITLE_ACCENT_VERTICAL_OFFSET * scale,
  };

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", gap: gap }}>
        <Text style={textStyle} numberOfLines={1}>
          <Text style={{ color: accentColor }}>D</Text>
          <Text style={{ color: mainColor }}>{"iam\u2756nd"}</Text>
        </Text>
        <LogoIcon size={fontSize} symbolSquareColor={symbolSquareColor} symbolCubeColor={symbolCubeColor} />
        <Text style={textStyle} numberOfLines={1}>
          <Text style={{ color: accentColor }}>D</Text>
          <Text style={{ color: mainColor }}>ice</Text>
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SUBTITLE_ACCENT_MARGIN * scale }}>
        <AccentLines {...accentProps} align="flex-end" />
        <Text style={[subtitleStyle, { marginRight: -SUBTITLE_LETTER_SPACING * scale }]}>BASEBALL</Text>
        <AccentLines {...accentProps} align="flex-start" />
      </View>
    </View>
  );
}