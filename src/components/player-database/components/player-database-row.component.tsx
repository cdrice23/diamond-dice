import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { usePlayerRowEntrance } from '@/components/player-database/hooks/use-player-row-entrance.hook';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

type PlayerDatabaseRowProps = {
  id: string;
  name: string;
  isQualifiedBatter: boolean;
  isQualifiedPitcher: boolean;
  level: 1 | 2 | 3;
  isFirst: boolean;
  indexInBatch: number;
  reverseEntrance?: boolean;
};

function getLevelColor(colors: ReturnType<typeof useTheme>['colors'], level: 1 | 2 | 3): string {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  return colors.level3;
}

function PositionIcons({
  isQualifiedBatter,
  isQualifiedPitcher,
  color,
}: {
  isQualifiedBatter: boolean;
  isQualifiedPitcher: boolean;
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      {isQualifiedBatter && <PixelIcon name="bat" size={20} color={color} />}
      {isQualifiedPitcher && <PixelIcon name="baseball" size={20} color={color} />}
    </View>
  );
}

export function PlayerDatabaseRow({
  id,
  name,
  isQualifiedBatter,
  isQualifiedPitcher,
  level,
  isFirst,
  indexInBatch,
  reverseEntrance = false,
}: PlayerDatabaseRowProps) {
  const { colors } = useTheme();
  const entranceStyle = usePlayerRowEntrance(indexInBatch, reverseEntrance);
  const levelColor = getLevelColor(colors, level);

  return (
    <Animated.View style={entranceStyle} className={isFirst ? undefined : 'border-border border-t'}>
      <Pressable
        onPress={() => router.push(`/(app)/player-database/${id}`)}
        className="flex-row items-center gap-3 px-1 py-3 active:opacity-70"
        accessibilityRole="button"
      >
        <Chip label={`LVL. ${level}`} backgroundColor={levelColor} shape="square" className="w-12" />
        <Text className="text-foreground flex-1 text-lg font-semibold" numberOfLines={1}>
          {name}
        </Text>
        <PositionIcons
          isQualifiedBatter={isQualifiedBatter}
          isQualifiedPitcher={isQualifiedPitcher}
          color={colors.primary}
        />
      </Pressable>
    </Animated.View>
  );
}