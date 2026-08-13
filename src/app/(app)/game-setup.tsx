import { ScreenBackdrop } from '@/components/navigation/components/screen-backdrop.component';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export default function GameSetupScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <PlaceholderScreen
          title="Game Setup"
          accentColor={colors.level3}
          floating
          cardBackgroundColor={colors.background}
        />
        <Pressable
          onPress={() => router.push('/(app)/home')}
          style={{
            position: 'absolute',
            bottom: 40,
            alignSelf: 'center',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            backgroundColor: colors.level1,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Back to Home</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}