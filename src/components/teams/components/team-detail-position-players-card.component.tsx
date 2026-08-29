import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Card } from '@/components/primitives/card.component';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { TeamDetailViewToggle, type TeamDetailViewMode } from '@/components/teams/components/team-detail-view-toggle.component';
import { TeamDiamondPositions, type PositionPlayerRef } from '@/components/teams/components/team-diamond-positions.component';
import { levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import { TeamDetailPitcherSlot, TeamDetailPositionSlot } from '../teams.types';

const AVATAR_WIDTH = 56;
const AVATAR_ASPECT_RATIO = 0.8;
const BATTING_ORDER_BOX_WIDTH = 40;

type TeamDetailPositionPlayersCardProps = {
  positionPlayers: TeamDetailPositionSlot[];
  pitchers: TeamDetailPitcherSlot[];
  bandColor: string;
  textColor: string;
};

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

function toPlayerRef(slot: { player: { id: string; image_url: string | null } } | undefined): PositionPlayerRef | null {
  return slot ? { id: slot.player.id, image_url: slot.player.image_url } : null;
}

function buildDiamondData(positionPlayers: TeamDetailPositionSlot[], pitchers: TeamDetailPitcherSlot[]) {
  const byPosition = (position: string) => positionPlayers.find((p) => p.position === position);
  const outfielders = positionPlayers.filter((p) => p.position === 'OF');

  return {
    positions: {
      C: byPosition('C')?.level ?? null,
      '1B': byPosition('1B')?.level ?? null,
      '2B': byPosition('2B')?.level ?? null,
      SS: byPosition('SS')?.level ?? null,
      '3B': byPosition('3B')?.level ?? null,
      OF: outfielders.map((p) => p.level),
    },
    pitcherLevels: pitchers.map((p) => p.level),
    positionPlayerRefs: {
      C: toPlayerRef(byPosition('C')),
      '1B': toPlayerRef(byPosition('1B')),
      '2B': toPlayerRef(byPosition('2B')),
      SS: toPlayerRef(byPosition('SS')),
      '3B': toPlayerRef(byPosition('3B')),
      OF: outfielders.map((p) => toPlayerRef(p)),
    },
  };
}

export function TeamDetailPositionPlayersCard({
  positionPlayers,
  pitchers,
  bandColor,
  textColor,
}: TeamDetailPositionPlayersCardProps) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<TeamDetailViewMode>('list');
  const [diamondWidth, setDiamondWidth] = useState(0);

  if (positionPlayers.length === 0) {
    return null;
  }

  function handleLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== diamondWidth) {
      setDiamondWidth(width);
    }
  }

  const sorted = sortByBattingOrder(positionPlayers);
  const diamondData = buildDiamondData(positionPlayers, pitchers);

  return (
    <Card className="mx-4">
      <TeamDetailCardHeader label="Position Players" bandColor={bandColor} textColor={textColor} />

      <View className="mb-3 flex-row justify-end">
        <TeamDetailViewToggle
          mode={viewMode}
          onChange={setViewMode}
          activeColor={bandColor}
          activeIconColor={textColor}
          inactiveColor={colors.mutedForeground}
        />
      </View>

      {viewMode === 'list' ? (
        <View className="gap-4">
          {sorted.map((slot, index) => (
            <PositionPlayerRow key={`${slot.position}-${slot.player.id}`} slot={slot} index={index} />
          ))}
        </View>
      ) : (
        <View onLayout={handleLayout} className="items-center">
          {diamondWidth > 0 && (
            <AnimatedCascadeItem index={0} staggerDelayMs={0} fadeDurationMs={400} translateYStart={0}>
              <TeamDiamondPositions
                positions={diamondData.positions}
                pitcherLevels={diamondData.pitcherLevels}
                width={diamondWidth}
                viewMode="avatar"
                showPitchers={false}
                positionPlayerRefs={diamondData.positionPlayerRefs}
              />
            </AnimatedCascadeItem>
          )}
        </View>
      )}
    </Card>
  );
}