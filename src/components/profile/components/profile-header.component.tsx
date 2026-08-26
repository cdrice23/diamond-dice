import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type ProfileHeaderProps = {
  username: string;
  displayName: string;
  scrollY: SharedValue<number>;
};

export const PROFILE_HEADER_COLLAPSE_DISTANCE = 100;
const EXPANDED_USERNAME_FONT_SIZE = 18;
const COLLAPSED_USERNAME_FONT_SIZE = 14;
const EXPANDED_DISPLAY_NAME_FONT_SIZE = 34;
const COLLAPSED_DISPLAY_NAME_FONT_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;
const COLLAPSED_ICON_SCALE = 0.78;
const THEME_BODY_FONT = 'VT323_400Regular';

export function ProfileHeader({ username, displayName, scrollY }: ProfileHeaderProps) {
  const { colors } = useTheme();

  const usernameAnimatedStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, PROFILE_HEADER_COLLAPSE_DISTANCE],
      [EXPANDED_USERNAME_FONT_SIZE, COLLAPSED_USERNAME_FONT_SIZE],
      Extrapolation.CLAMP
    ),
  }));

  const displayNameAnimatedStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, PROFILE_HEADER_COLLAPSE_DISTANCE],
      [EXPANDED_DISPLAY_NAME_FONT_SIZE, COLLAPSED_DISPLAY_NAME_FONT_SIZE],
      Extrapolation.CLAMP
    ),
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, PROFILE_HEADER_COLLAPSE_DISTANCE],
          [1, COLLAPSED_ICON_SCALE],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View className="flex-row items-center justify-between px-4 pt-2">
      <View>
        <Animated.Text style={[{ fontFamily: THEME_BODY_FONT, color: colors.mutedForeground }, usernameAnimatedStyle]}>
          @{username}
        </Animated.Text>
        <Animated.Text
          style={[{ fontFamily: THEME_BODY_FONT, fontWeight: '700', color: colors.foreground }, displayNameAnimatedStyle]}
        >
          {displayName}
        </Animated.Text>
      </View>

      <Animated.View style={iconAnimatedStyle}>
        <Pressable
          onPress={() => router.push('/(app)/edit-profile')}
          accessibilityRole="button"
          accessibilityLabel="Edit profile settings"
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="settings-outline" size={EXPANDED_ICON_SIZE} color={colors.foreground} />
        </Pressable>
      </Animated.View>
    </View>
  );
}