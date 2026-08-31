import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { WizardPitcherSlot } from '../teams.types';

const AVATAR_WIDTH = 56;
const AVATAR_ASPECT_RATIO = 0.8;
const POSITION_BADGE_WIDTH = 40;
const ROW_HEIGHT = AVATAR_WIDTH / AVATAR_ASPECT_RATIO;

type RosterPitcherRowProps = {
  slot: WizardPitcherSlot;
  onPress: () => void;
  onRemove?: () => void;
};

export function RosterPitcherRow({ slot, onPress, onRemove }: RosterPitcherRowProps) {
  const { colors } = useTheme();
  const isFilled = slot.playerId !== null;

  return (
    <View className="flex-row items-center gap-2">
      <Pressable onPress={onPress} className="flex-1 flex-row items-center gap-2.5 active:opacity-70">
        <View
          className="items-center justify-center rounded-sm"
          style={{ width: POSITION_BADGE_WIDTH, height: ROW_HEIGHT, backgroundColor: isFilled ? levelColor(slot.level, colors) : colors.muted }}
        >
          <Text className="text-xl font-bold" style={{ color: isFilled ? '#FFFFFF' : colors.mutedForeground }}>
            P
          </Text>
        </View>

        {isFilled ? (
          <View
            className="flex-1 flex-row items-center overflow-hidden rounded-md border"
            style={{ borderColor: levelColor(slot.level, colors), height: ROW_HEIGHT }}
          >
            <PlayerAvatar imageUrl={slot.playerImageUrl} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />
            <View className="flex-1 justify-center gap-1 pl-4 pr-3">
              <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
                {slot.playerName}
              </Text>
              <Chip label={`Lvl. ${slot.level ?? '--'}`} backgroundColor={levelColor(slot.level, colors)} shape="square" className="self-start" />
            </View>
          </View>
        ) : (
          <View
            className="border-border flex-1 flex-row items-center gap-1.5 rounded-md border border-dashed pl-3"
            style={{ height: ROW_HEIGHT }}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.mutedForeground} />
            <Text variant="muted" className="text-lg font-semibold">
              Add Pitcher
            </Text>
          </View>
        )}
      </Pressable>

      {onRemove && (
        <Pressable onPress={onRemove} className="p-2 active:opacity-60" accessibilityLabel="Remove pitcher slot">
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.destructive} />
        </Pressable>
      )}
    </View>
  );
}