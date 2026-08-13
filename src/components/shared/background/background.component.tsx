import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BACKGROUND_SVG } from './background-svg';

type BackgroundProps = {
  color: string;
  opacity?: number;
};

export function Background({ color, opacity = 0.4 }: BackgroundProps) {
  const xml = BACKGROUND_SVG.replace(/__COLOR__/g, color);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SvgXml xml={xml} width="100%" height="100%" style={{ opacity }} />
    </View>
  );
}