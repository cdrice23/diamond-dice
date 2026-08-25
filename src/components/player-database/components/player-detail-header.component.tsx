import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type PlayerDetailHeaderProps = {
  player: PlayerDetail;
  scrollY: SharedValue<number>;
};

export const EXPANDED_IMAGE_WIDTH = 116;
export const COLLAPSED_IMAGE_WIDTH = 52;
export const IMAGE_ASPECT_RATIO = 0.8;
export const HEIGHT_COLLAPSE_DISTANCE = 140;
const EXPANDED_NAME_FONT_SIZE = 30;
const COLLAPSED_NAME_FONT_SIZE = 20;
const POSITIONS_FONT_SIZE = 20;
const SECONDARY_BLOCK_HEIGHT = 72;
const OPACITY_FADE_DISTANCE = 90;
const THEME_BODY_FONT = 'VT323_400Regular';

function resolveEffectiveRoles(player: PlayerDetail) {
  const isEffectivePitcher = player.eligible_positions.includes('P') && player.is_qualified_pitcher;
  const isEffectiveBatter =
    player.eligible_positions.some((position) => position !== 'P') && player.is_qualified_batter;

  return { isEffectiveBatter, isEffectivePitcher, isTwoWay: isEffectiveBatter && isEffectivePitcher };
}

function levelColor(level: number | null, colors: ReturnType<typeof useTheme>['colors']): string {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

function PositionsRow({ positions }: { positions: string[] }) {
  const { colors } = useTheme();

  if (positions.length === 0) {
    return (
      <Text variant="muted" style={{ fontSize: POSITIONS_FONT_SIZE }}>
        —
      </Text>
    );
  }

  return (
    <View className="flex-row items-center">
      {positions.map((position, index) => (
        <View key={position} className="flex-row items-center">
          {index > 0 && <View className="mx-2 h-4 w-px" style={{ backgroundColor: colors.mutedForeground }} />}
          <Text className="text-primary font-semibold" style={{ fontSize: POSITIONS_FONT_SIZE }}>
            {position}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PlayerDetailHeader({ player, scrollY }: PlayerDetailHeaderProps) {
  const { colors } = useTheme();
  const { isEffectiveBatter, isEffectivePitcher, isTwoWay } = resolveEffectiveRoles(player);

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_IMAGE_WIDTH, COLLAPSED_IMAGE_WIDTH],
      Extrapolation.CLAMP
    );
    return {
      width,
      height: width / IMAGE_ASPECT_RATIO,
    };
  });

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_NAME_FONT_SIZE, COLLAPSED_NAME_FONT_SIZE],
      Extrapolation.CLAMP
    ),
  }));

  const secondaryAnimatedStyle = useAnimatedStyle(() => {
    const opacity = 1 - interpolate(scrollY.value, [0, OPACITY_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP);
    const height = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [SECONDARY_BLOCK_HEIGHT, 0],
      Extrapolation.CLAMP
    );
    const marginTop = interpolate(scrollY.value, [0, HEIGHT_COLLAPSE_DISTANCE], [8, 0], Extrapolation.CLAMP);

    return { opacity, height, marginTop };
  });

  return (
    <View className="flex-row items-center gap-4 px-4">
      {player.image_url ? (
        <Animated.Image source={{ uri: player.image_url }} resizeMode="cover" style={[{ borderRadius: 14 }, imageAnimatedStyle]} />
      ) : (
        <Animated.View className="bg-muted items-center justify-center" style={[{ borderRadius: 14 }, imageAnimatedStyle]}>
          <PixelIcon name="player" size={EXPANDED_IMAGE_WIDTH * 0.5} color={colors.mutedForeground} />
        </Animated.View>
      )}

      <View className="flex-1 justify-center">
        <Animated.Text
          style={[{ fontFamily: THEME_BODY_FONT, fontWeight: '700', color: colors.foreground }, nameAnimatedStyle]}
          numberOfLines={1}
        >
          {player.name}
        </Animated.Text>

        <Animated.View style={[{ overflow: 'hidden', gap: 8 }, secondaryAnimatedStyle]}>
          <PositionsRow positions={player.eligible_positions} />

          <View className="flex-row flex-wrap items-center gap-3">
            {(isTwoWay || isEffectiveBatter) && (
              <View className="flex-row items-center gap-2">
                <PixelIcon name="bat" size={16} color={colors.primary} />
                <Chip
                  label={`Lvl. ${player.batting_rating_level ?? '--'}`}
                  backgroundColor={levelColor(player.batting_rating_level, colors)}
                  shape="square"
                />
              </View>
            )}
            {(isTwoWay || isEffectivePitcher) && (
              <View className="flex-row items-center gap-2">
                <PixelIcon name="baseball" size={16} color={colors.primary} />
                <Chip
                  label={`Lvl. ${player.pitching_rating_level ?? '--'}`}
                  backgroundColor={levelColor(player.pitching_rating_level, colors)}
                  shape="square"
                />
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}