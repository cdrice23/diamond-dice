import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Card } from '@/components/primitives/card.component';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { TeamDetailPositionSlot } from '../teams.types';

const AVATAR_WIDTH = 56;
const AVATAR_ASPECT_RATIO = 0.8;
const BATTING_ORDER_BOX_WIDTH = 40;

type TeamDetailPositionPlayersCardProps = {
  positionPlayers: TeamDetailPositionSlot[];
  bandColor: string;
  textColor: string;
};

function levelColor(level: number | null, colors: ReturnType<typeof useTheme>['colors']): string {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

function BattingOrderBox({ battingOrder }: { battingOrder: number | null }) {
  const height = AVATAR_WIDTH / AVATAR_ASPECT_RATIO;

  return (
    <View
      className="bg-muted items-center justify-center"
      style={{ width: BATTING_ORDER_BOX_WIDTH, height, borderRadius: 4 }}
    >
      <Text className="text-foreground text-xl font-bold">{battingOrder ?? '—'}</Text>
    </View>
  );
}

function PositionPlayerRow({ slot, index }: { slot: TeamDetailPositionSlot; index: number }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <AnimatedCascadeItem index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={6}>
      <Pressable
        onPress={() => router.push(`/player-database/${slot.player.id}`)}
        className="flex-row items-center gap-2.5 active:opacity-70"
      >
        <BattingOrderBox battingOrder={slot.battingOrder} />
        <PlayerAvatar imageUrl={slot.player.image_url} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />

        <View className="flex-1 justify-center gap-1">
          <Text numberOfLines={1}>
            <Text className="text-foreground text-lg font-semibold">{slot.player.name}</Text>
            <Text variant="muted" className="text-base"> - {slot.position}</Text>
          </Text>
          <Chip label={`Lvl. ${slot.level ?? '--'}`} backgroundColor={levelColor(slot.level, colors)} shape="square" className="self-start" />
        </View>
      </Pressable>
    </AnimatedCascadeItem>
  );
}

function sortByBattingOrder(players: TeamDetailPositionSlot[]): TeamDetailPositionSlot[] {
  return [...players].sort((a, b) => {
    if (a.battingOrder == null) return 1;
    if (b.battingOrder == null) return -1;
    return a.battingOrder - b.battingOrder;
  });
}

export function TeamDetailPositionPlayersCard({ positionPlayers, bandColor, textColor }: TeamDetailPositionPlayersCardProps) {
  if (positionPlayers.length === 0) {
    return null;
  }

  const sorted = sortByBattingOrder(positionPlayers);

  return (
    <Card className="mx-4">
      <TeamDetailCardHeader label="Position Players" bandColor={bandColor} textColor={textColor} />

      <View className="gap-4">
        {sorted.map((slot, index) => (
          <PositionPlayerRow key={`${slot.position}-${slot.player.id}`} slot={slot} index={index} />
        ))}
      </View>
    </Card>
  );
}