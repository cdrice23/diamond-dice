import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { WizardPositionSlot } from '../teams.types';

const AVATAR_WIDTH = 56;
const AVATAR_ASPECT_RATIO = 0.8;
const POSITION_BADGE_WIDTH = 40;

const POSITION_LABELS: Record<string, string> = {
  C: 'Catcher',
  '1B': 'First Baseman',
  '2B': 'Second Baseman',
  '3B': 'Third Baseman',
  SS: 'Shortstop',
  OF: 'Outfielder',
  DH: 'Designated Hitter',
};

type RosterPositionRowProps = {
  slot: WizardPositionSlot;
  onPress: () => void;
};

export function RosterPositionRow({ slot, onPress }: RosterPositionRowProps) {
  const { colors } = useTheme();
  const isFilled = slot.playerId !== null;
  const boxHeight = AVATAR_WIDTH / AVATAR_ASPECT_RATIO;
  const label = POSITION_LABELS[slot.position] ?? slot.position;

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-2.5 active:opacity-70">
      <View
        className="items-center justify-center rounded-sm"
        style={{
          width: POSITION_BADGE_WIDTH,
          height: boxHeight,
          backgroundColor: isFilled ? levelColor(slot.level, colors) : colors.muted,
        }}
      >
        <Text className="text-base font-bold" style={{ color: isFilled ? '#FFFFFF' : colors.mutedForeground }}>
          {slot.position}
        </Text>
      </View>

      {isFilled ? (
        <>
          <PlayerAvatar imageUrl={slot.playerImageUrl} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />
          <View className="flex-1 justify-center gap-1">
            <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
              {slot.playerName}
            </Text>
            <Chip label={`Lvl. ${slot.level ?? '--'}`} backgroundColor={levelColor(slot.level, colors)} shape="square" className="self-start" />
          </View>
        </>
      ) : (
        <View
          className="border-border flex-1 flex-row items-center justify-center gap-1.5 rounded-md border border-dashed"
          style={{ height: boxHeight }}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.mutedForeground} />
          <Text variant="muted" className="text-lg font-semibold">
            Add {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}