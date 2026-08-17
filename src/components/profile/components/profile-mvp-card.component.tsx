import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { ProfileStatBar } from '@/components/profile/components/profile-stat-bar.component';
import { usePlayerSummary } from '@/components/profile/hooks/use-player-summary.hook';
import type { MvpBatterStats, MvpPitcherStats } from '@/components/profile/profile.types';
import { adjustHslLightness } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Image, View } from 'react-native';

type ProfileMvpCardProps =
  | { type: 'batter'; stats: MvpBatterStats }
  | { type: 'pitcher'; stats: MvpPitcherStats };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-foreground text-xl font-bold">{value}</Text>
      <Text variant="muted" className="text-xs">
        {label}
      </Text>
    </View>
  );
}

function BatterStatsRow({ stats }: { stats: MvpBatterStats }) {
  const { colors } = useTheme();
  const battingAvg = stats.totalAtBats > 0 ? stats.totalHits / stats.totalAtBats : 0;
  const atBats = stats.totalAtBats || 1;

  return (
    <>
      <View className="mt-3 flex-row justify-between">
        <Stat label="AB" value={String(stats.totalAtBats)} />
        <Stat label="AVG" value={battingAvg.toFixed(3).replace(/^0/, '')} />
        <Stat label="R" value={String(stats.totalRuns)} />
        <Stat label="RBI" value={String(stats.totalRbi)} />
        <Stat label="HR" value={String(stats.totalHomeRuns)} />
      </View>
      <View className="mt-4">
        <ProfileStatBar
          fillerColor={colors.muted}
          segments={[
            { label: '1B', percent: stats.totalSingles / atBats, color: adjustHslLightness(colors.level1, 24) },
            { label: '2B', percent: stats.totalDoubles / atBats, color: adjustHslLightness(colors.level1, 14) },
            { label: '3B', percent: stats.totalTriples / atBats, color: adjustHslLightness(colors.level1, 6) },
            { label: 'HR', percent: stats.totalHomeRuns / atBats, color: colors.level1 },
            { label: 'BB', percent: stats.totalWalks / atBats, color: colors.level2 },
            { label: 'K', percent: stats.totalStrikeouts / atBats, color: colors.level3 },
          ]}
        />
      </View>
    </>
  );
}

function PitcherStatsRow({ stats }: { stats: MvpPitcherStats }) {
  const { colors } = useTheme();
  const battersFaced = stats.totalBattersFaced || 1;

  return (
    <>
      <View className="mt-3 flex-row justify-between">
        <Stat label="IP" value={stats.totalInningsPitched?.toFixed(1) ?? '--'} />
        <Stat label="BF" value={String(stats.totalBattersFaced)} />
        <Stat label="ERA" value={stats.era?.toFixed(2) ?? '--'} />
        <Stat label="WHIP" value={stats.whip?.toFixed(2) ?? '--'} />
      </View>
      <View className="mt-4">
        <ProfileStatBar
          segments={[
            { label: 'K', percent: stats.totalOutsRecorded / battersFaced, color: colors.level1 },
            { label: 'H', percent: stats.totalHitsAllowed / battersFaced, color: colors.level3 },
            { label: 'BB', percent: stats.totalWalksAllowed / battersFaced, color: colors.level2 },
          ]}
        />
      </View>
    </>
  );
}

export function ProfileMvpCard(props: ProfileMvpCardProps) {
  const { player } = usePlayerSummary(props.stats.playerId);

  return (
    <Card className="mx-4" onPress={() => router.push(`/(app)/player-database/${props.stats.playerId}`)}>
      <Text className="text-foreground mb-2 text-base font-semibold">
        {props.type === 'batter' ? 'MVP Batter' : 'MVP Pitcher'}
      </Text>
      <View className="flex-row items-center gap-3">
        {player?.imageUrl ? (
          <Image source={{ uri: player.imageUrl }} className="h-14 w-14 rounded-full" />
        ) : (
          <View className="bg-muted h-14 w-14 rounded-full" />
        )}
        <Text className="text-foreground flex-1 text-base font-semibold" numberOfLines={1}>
          {player?.name ?? 'Loading...'}
        </Text>
      </View>
      {props.type === 'batter' ? <BatterStatsRow stats={props.stats} /> : <PitcherStatsRow stats={props.stats} />}
    </Card>
  );
}