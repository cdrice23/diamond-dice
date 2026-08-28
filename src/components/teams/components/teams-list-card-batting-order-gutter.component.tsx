import { Text } from '@/components/primitives/text.component';
import type { BattingOrderSlot } from '@/components/teams/teams.types';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

const ACCENT_WIDTH = 3;
const ACCENT_HEIGHT = 14;
const NUMBER_COLUMN_WIDTH = 14;
const POSITION_COLUMN_WIDTH = 24;
const NUMBER_TO_UNIT_GAP = 12;
const ACCENT_TO_POSITION_GAP = 6;

type TeamsListCardBattingOrderGutterProps = {
  battingOrder: BattingOrderSlot[];
};

function levelColor(level: number | null, colors: ReturnType<typeof useTheme>['colors']) {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

export function TeamsListCardBattingOrderGutter({ battingOrder }: TeamsListCardBattingOrderGutterProps) {
  const { colors } = useTheme();

  return (
    <View className="items-center gap-1.5">
      <Text className="text-foreground text-xs font-semibold uppercase" style={{ letterSpacing: 0.6 }}>
        Batting Order
      </Text>

      {battingOrder.map((slot, i) => (
        <View key={i} className="flex-row items-center" style={{ gap: NUMBER_TO_UNIT_GAP }}>
          <Text className="text-foreground text-right text-xs font-semibold" style={{ width: NUMBER_COLUMN_WIDTH }}>
            {i + 1}
          </Text>
          <View className="flex-row items-center" style={{ gap: ACCENT_TO_POSITION_GAP }}>
            <View
              style={{
                width: ACCENT_WIDTH,
                height: ACCENT_HEIGHT,
                borderRadius: ACCENT_WIDTH / 2,
                backgroundColor: levelColor(slot.level, colors),
              }}
            />
            <Text className="text-foreground text-xs font-semibold" style={{ width: POSITION_COLUMN_WIDTH }}>
              {slot.position}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}