import { hslToTransparentHsla } from '@/utils/color';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type PlayerDatabaseFadeListProps = {
  backgroundColor: string;
  fadeHeight?: number;
  bottomInset?: number;
};

const DEFAULT_FADE_HEIGHT = 32;

export function PlayerDatabaseFadeList({
  backgroundColor,
  fadeHeight = DEFAULT_FADE_HEIGHT,
  bottomInset = 0,
}: PlayerDatabaseFadeListProps) {
  const transparent = hslToTransparentHsla(backgroundColor);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: fadeHeight }}>
        <LinearGradient colors={[backgroundColor, transparent]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ position: 'absolute', bottom: bottomInset, left: 0, right: 0, height: fadeHeight }}>
        <LinearGradient colors={[transparent, backgroundColor]} style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}