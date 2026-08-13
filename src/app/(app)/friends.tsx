import { ScreenBackdrop } from '@/components/navigation/components/screen-backdrop.component';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <PlaceholderScreen title="Friends" accentColor={colors.level3} floating cardBackgroundColor={colors.background} />
      </Animated.View>
    </View>
  );
}