import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { Chip } from '@/components/primitives/chip.component';
import { Skeleton } from '@/components/primitives/skeleton.component';
import { useTheme } from '@/utils/theme-provider';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type PlayerDetailHeaderProps = {
  player: PlayerDetail;
  scrollY: SharedValue<number>;
};

export const EXPANDED_IMAGE_WIDTH = 96;
export const COLLAPSED_IMAGE_WIDTH = 64;
export const IMAGE_ASPECT_RATIO = 0.8;
export const HEIGHT_COLLAPSE_DISTANCE = 140;
const EXPANDED_NAME_FONT_SIZE = 36;
const COLLAPSED_NAME_FONT_SIZE = 30;
const EXPANDED_POSITIONS_FONT_SIZE = 24;
const COLLAPSED_POSITIONS_FONT_SIZE = 20;
const EXPANDED_SECONDARY_HEIGHT = 84;
const COLLAPSED_SECONDARY_HEIGHT = 62;
const EXPANDED_SECONDARY_GAP = 16;
const COLLAPSED_SECONDARY_GAP = 2;
const EXPANDED_SECONDARY_MARGIN_TOP = 10;
const COLLAPSED_SECONDARY_MARGIN_TOP = 1;
const EXPANDED_CHIP_ROW_SCALE = 1;
const COLLAPSED_CHIP_ROW_SCALE = 0.8;
const EXPANDED_ROW_GAP = 16;
const COLLAPSED_ROW_GAP = 12;
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

function PositionsRow({ positions, scrollY }: { positions: string[]; scrollY: SharedValue<number> }) {
  const { colors } = useTheme();

  const positionsAnimatedStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_POSITIONS_FONT_SIZE, COLLAPSED_POSITIONS_FONT_SIZE],
      Extrapolation.CLAMP
    ),
  }));

  const separatorAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, HEIGHT_COLLAPSE_DISTANCE], [18, 16], Extrapolation.CLAMP),
  }));

  if (positions.length === 0) {
    return (
      <Animated.Text
        style={[{ fontFamily: THEME_BODY_FONT, color: colors.mutedForeground }, positionsAnimatedStyle]}
      >
        —
      </Animated.Text>
    );
  }

  return (
    <View className="flex-row items-center">
      {positions.map((position, index) => (
        <View key={position} className="flex-row items-center">
          {index > 0 && (
            <Animated.View className="mx-2 w-px" style={[{ backgroundColor: colors.mutedForeground }, separatorAnimatedStyle]} />
          )}
          <Animated.Text
            style={[{ fontFamily: THEME_BODY_FONT, fontWeight: '600', color: colors.primary }, positionsAnimatedStyle]}
          >
            {position}
          </Animated.Text>
        </View>
      ))}
    </View>
  );
}

export function PlayerDetailHeader({ player, scrollY }: PlayerDetailHeaderProps) {
  const { colors } = useTheme();
  const { isEffectiveBatter, isEffectivePitcher, isTwoWay } = resolveEffectiveRoles(player);
  const [imageLoaded, setImageLoaded] = useState(!player.image_url);

  const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

  const imageSizeStyle = useAnimatedStyle(() => {
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

  const imageWrapperStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_IMAGE_WIDTH, COLLAPSED_IMAGE_WIDTH],
      Extrapolation.CLAMP
    );

    return { width };
  });

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    gap: interpolate(scrollY.value, [0, HEIGHT_COLLAPSE_DISTANCE], [EXPANDED_ROW_GAP, COLLAPSED_ROW_GAP], Extrapolation.CLAMP),
  }));

  const nameAnimatedStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_NAME_FONT_SIZE, COLLAPSED_NAME_FONT_SIZE],
      Extrapolation.CLAMP
    );
    return { fontSize, lineHeight: fontSize * 1.05 };
  });

  const secondaryAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_SECONDARY_HEIGHT, COLLAPSED_SECONDARY_HEIGHT],
      Extrapolation.CLAMP
    );
    const gap = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_SECONDARY_GAP, COLLAPSED_SECONDARY_GAP],
      Extrapolation.CLAMP
    );
    const marginTop = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_SECONDARY_MARGIN_TOP, COLLAPSED_SECONDARY_MARGIN_TOP],
      Extrapolation.CLAMP
    );

    return { height, gap, marginTop };
  });

  const chipRowAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, HEIGHT_COLLAPSE_DISTANCE],
      [EXPANDED_CHIP_ROW_SCALE, COLLAPSED_CHIP_ROW_SCALE],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      transformOrigin: 'left center',
    };
  });

  return (
    <Animated.View className="flex-row justify-center items-center px-4" style={rowAnimatedStyle}>
      <Animated.View style={[{ alignSelf: 'center', justifyContent: 'center' }, imageWrapperStyle]}>
        {player.image_url ? (
          <>
            {!imageLoaded && <Skeleton className="bg-border absolute rounded-[14px]" style={imageSizeStyle} />}
              <AnimatedExpoImage
                source={{ uri: player.image_url }}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                style={[{ borderRadius: 14, opacity: imageLoaded ? 1 : 0 }, imageSizeStyle]}
              />
          </>
        ) : (
          <Animated.View className="bg-muted items-center justify-center" style={[{ borderRadius: 14 }, imageSizeStyle]}>
            <PixelIcon name="player" size={EXPANDED_IMAGE_WIDTH * 0.5} color={colors.mutedForeground} />
          </Animated.View>
        )}
      </Animated.View>

      <View className="flex-1" style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
        <Animated.Text
          style={[{ fontFamily: THEME_BODY_FONT, fontWeight: '700', color: colors.foreground }, nameAnimatedStyle]}
          numberOfLines={1}
        >
          {player.name}
        </Animated.Text>

        <Animated.View style={[{ overflow: 'hidden' }, secondaryAnimatedStyle]}>
          <PositionsRow positions={player.eligible_positions} scrollY={scrollY} />

          <Animated.View className="flex-row flex-wrap items-center gap-3" style={chipRowAnimatedStyle}>
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
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}