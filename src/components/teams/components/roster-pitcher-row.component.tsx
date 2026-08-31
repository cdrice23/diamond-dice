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

type RosterPitcherRowProps = {
  slot: WizardPitcherSlot;
  onPress: () => void;
};

export function RosterPitcherRow({ slot, onPress }: RosterPitcherRowProps) {
  const { colors } = useTheme();
  const isFilled = slot.playerId !== null;
  const boxHeight = AVATAR_WIDTH / AVATAR_ASPECT_RATIO;

  if (!isFilled) {
    return (
      <Pressable
        onPress={onPress}
        className="border-border flex-row items-center justify-center gap-1.5 rounded-md border border-dashed active:opacity-70"
        style={{ height: boxHeight }}
      >
        <MaterialCommunityIcons name="plus" size={18} color={colors.mutedForeground} />
        <Text variant="muted" className="text-lg font-semibold">
          Add Pitcher
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-2.5 active:opacity-70">
      <PlayerAvatar imageUrl={slot.playerImageUrl} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />
      <View className="flex-1 justify-center gap-1">
        <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
          {slot.playerName}
        </Text>
        <Chip label={`Lvl. ${slot.level ?? '--'}`} backgroundColor={levelColor(slot.level, colors)} shape="square" className="self-start" />
      </View>
    </Pressable>
  );
}