import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AUTH_BACKGROUND_SVG } from './auth-background-svg';

type AuthBackgroundProps = {
  color: string;
  opacity?: number;
};

export function AuthBackground({ color, opacity = 0.4 }: AuthBackgroundProps) {
  const xml = AUTH_BACKGROUND_SVG.replace(/__COLOR__/g, color);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SvgXml xml={xml} width="100%" height="100%" style={{ opacity }} />
    </View>
  );
}