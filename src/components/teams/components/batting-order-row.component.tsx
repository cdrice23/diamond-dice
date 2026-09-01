import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { WizardPositionSlot } from '../teams.types';

const AVATAR_WIDTH = 40;
const AVATAR_ASPECT_RATIO = 0.8;
const ORDER_BADGE_WIDTH = 30;
const ROW_HEIGHT = AVATAR_WIDTH / AVATAR_ASPECT_RATIO;

type BattingOrderRowProps = {
  slot: WizardPositionSlot;
  order: number;
  onDragStart: () => void;
  isActive: boolean;
};

export function BattingOrderRow({ slot, order, onDragStart, isActive }: BattingOrderRowProps) {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center gap-2 rounded-md"
      style={{ backgroundColor: isActive ? colors.muted : colors.background }}
    >
      <View className="items-center justify-center rounded-sm" style={{ width: ORDER_BADGE_WIDTH, height: ROW_HEIGHT, backgroundColor: colors.muted }}>
        <Text className="text-foreground text-sm font-bold">{order}</Text>
      </View>

      <View className="border-border flex-1 flex-row items-center overflow-hidden rounded-md border" style={{ height: ROW_HEIGHT }}>
        <PlayerAvatar imageUrl={slot.playerImageUrl} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />
        <View className="flex-1 justify-center gap-0.5 pl-2.5" style={{ minWidth: 0 }}>
          <Text numberOfLines={1}>
            <Text className="text-foreground text-sm font-semibold">{slot.playerName}</Text>
            <Text variant="muted" className="text-xs font-normal"> - {slot.position}</Text>
          </Text>
          <Chip label={`Lvl. ${slot.level ?? '--'}`} backgroundColor={levelColor(slot.level, colors)} shape="square" className="self-start" />
        </View>
        <Pressable onPressIn={onDragStart} className="self-stretch justify-center px-2 active:opacity-60" accessibilityLabel="Drag to reorder">
          <MaterialCommunityIcons name="drag-horizontal-variant" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}