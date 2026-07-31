import { Text, useWindowDimensions, View } from "react-native";
import { BASE_CONTENT_WIDTH, BASE_FONT_SIZE, HORIZONTAL_PADDING, LOGO_COLOR_DEFAULT_ACCENT, LOGO_COLOR_DEFAULT_MAIN, LOGO_SPLASH_FONT_FAMILY } from "./branding.constants";
import { LogoIcon } from "./logo-icon.component";



type LogoSplashProps = {
  mainColor?: string;
  accentColor?: string;
  symbolSquareColor?: string;
  symbolCubeColor?: string;
  fontFamily?: string;
};

export function LogoSplash({
  mainColor = LOGO_COLOR_DEFAULT_MAIN,
  accentColor = LOGO_COLOR_DEFAULT_ACCENT,
  symbolSquareColor = LOGO_COLOR_DEFAULT_MAIN,
  symbolCubeColor = LOGO_COLOR_DEFAULT_MAIN,
  fontFamily = LOGO_SPLASH_FONT_FAMILY,
}: LogoSplashProps) {
  const { width: screenWidth } = useWindowDimensions();
  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const scale = Math.min(1, availableWidth / BASE_CONTENT_WIDTH);
  const fontSize = BASE_FONT_SIZE * scale;
  const gap = 4 * scale;

  const textStyle = { fontFamily, fontSize };

  return (
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
  );
}