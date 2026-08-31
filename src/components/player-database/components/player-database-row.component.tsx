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
  eligiblePositions: string[];
  isQualifiedBatter: boolean;
  isQualifiedPitcher: boolean;
  levelDisplay: string;
  levelColor: string;
  isFirst: boolean;
  indexInBatch: number;
  animate: boolean;
  reverseEntrance?: boolean;
  onPress?: () => void;
};

const ICON_SIZE = 18;

export function PlayerDatabaseRow({
  id,
  name,
  eligiblePositions,
  isQualifiedBatter,
  isQualifiedPitcher,
  levelDisplay,
  levelColor,
  isFirst,
  indexInBatch,
  animate,
  reverseEntrance = false,
  onPress,
}: PlayerDatabaseRowProps) {
  const { colors } = useTheme();
  const entranceStyle = usePlayerRowEntrance(indexInBatch, animate, reverseEntrance);

  return (
    <Animated.View style={entranceStyle} className={isFirst ? undefined : 'border-border border-t'}>
      <Pressable
        onPress={onPress ?? (() => router.push(`/(app)/player-database/${id}`))}
        className="flex-row items-center gap-3 px-1 py-3 active:opacity-70"
        accessibilityRole="button"
      >
        <Chip label={levelDisplay} backgroundColor={levelColor} shape="square" className="w-18" />
        <Text className="text-foreground flex-1 text-xl font-semibold" numberOfLines={1}>
          {name}
          {eligiblePositions.length > 0 && (
            <Text variant="muted" className="text-lg font-normal">
              {' '}
              - {eligiblePositions.join('/')}
            </Text>
          )}
        </Text>
        <View className="flex-row items-center gap-1">
          {isQualifiedBatter && <PixelIcon name="bat" size={ICON_SIZE} color={colors.primary} />}
          {isQualifiedPitcher && <PixelIcon name="baseball" size={ICON_SIZE} color={colors.primary} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}