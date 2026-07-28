import { Text, useWindowDimensions, View } from "react-native";
import { LogoIcon } from "./LogoIcon";

const HORIZONTAL_PADDING = 24; 
const BASE_FONT_SIZE = 42;
const BASE_CONTENT_WIDTH = 340;

type LogoSplashProps = {
  mainColor?: string;
  accentColor?: string;
  symbolSquareColor?: string;
  symbolCubeColor?: string;
  fontFamily?: string;
};

export function LogoSplash({
  mainColor = "#05162A",
  accentColor = "#000000",
  symbolSquareColor = "#000000",
  symbolCubeColor = "#000000",
  fontFamily = "Silkscreen_400Regular",
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