import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { PROFILE_HEADER_COLLAPSE_DISTANCE } from '@/components/profile/components/profile-header.component';
import type { OverviewStats } from '@/components/profile/profile.types';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type ProfileOverviewCardProps = {
  stats: OverviewStats;
  scrollY: SharedValue<number>;
};

const EXPANDED_VALUE_FONT_SIZE = 32;
const COLLAPSED_VALUE_FONT_SIZE = 26;
const LABEL_FONT_SIZE = 14;
const EXPANDED_VERTICAL_PADDING = 8;
const COLLAPSED_VERTICAL_PADDING = 0;
const THEME_BODY_FONT = 'VT323_400Regular';

function OverviewItem({
  label,
  value,
  onPress,
  scrollY,
}: {
  label: string;
  value: string;
  onPress: () => void;
  scrollY: SharedValue<number>;
}) {
  const { colors } = useTheme();

  const valueAnimatedStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, PROFILE_HEADER_COLLAPSE_DISTANCE],
      [EXPANDED_VALUE_FONT_SIZE, COLLAPSED_VALUE_FONT_SIZE],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Pressable onPress={onPress} className="flex-1 items-center active:opacity-60" accessibilityRole="button">
      <Animated.Text style={[{ fontFamily: THEME_BODY_FONT, fontWeight: '700', color: colors.primary }, valueAnimatedStyle]}>
        {value}
      </Animated.Text>
      <Text style={{ fontFamily: THEME_BODY_FONT, color: colors.mutedForeground, fontSize: LABEL_FONT_SIZE }}>{label}</Text>
    </Pressable>
  );
}

export function ProfileOverviewCard({ stats, scrollY }: ProfileOverviewCardProps) {
  const paddingAnimatedStyle = useAnimatedStyle(() => ({
    paddingVertical: interpolate(
      scrollY.value,
      [0, PROFILE_HEADER_COLLAPSE_DISTANCE],
      [EXPANDED_VERTICAL_PADDING, COLLAPSED_VERTICAL_PADDING],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Card className="mx-4">
      <Animated.View className="flex-row items-center justify-around" style={paddingAnimatedStyle}>
        <OverviewItem label="Record" value={`${stats.wins}-${stats.losses}`} onPress={() => router.push('/(app)/stats')} scrollY={scrollY} />
        <OverviewItem label="Teams" value={String(stats.teamCount)} onPress={() => router.push('/(app)/teams')} scrollY={scrollY} />
        <OverviewItem label="Friends" value={String(stats.friendCount)} onPress={() => router.push('/(app)/friends')} scrollY={scrollY} />
      </Animated.View>
    </Card>
  );
}