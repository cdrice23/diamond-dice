import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { ProfileStatBar } from '@/components/profile/components/profile-stat-bar.component';
import { ProfileStatLegend } from '@/components/profile/components/profile-stat-legend.component';
import { usePlayerSummary } from '@/components/profile/hooks/use-player-summary.hook';
import type { MvpBatterStats, MvpPitcherStats } from '@/components/profile/profile.types';
import { getShadeSequence } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { View } from 'react-native';
import { ProfileSkeleton } from './profile-skeleton';

type ProfileMvpCardProps =
  | { type: 'batter'; stats: MvpBatterStats }
  | { type: 'pitcher'; stats: MvpPitcherStats };

function deriveBatterOutcomeCounts(stats: {
  totalAtBats: number;
  totalWalks: number;
  totalConnections: number;
  totalHits: number;
}): { strikeouts: number; fieldedOuts: number } {
  const strikeouts = Math.max(0, stats.totalAtBats - stats.totalWalks - stats.totalConnections);
  const fieldedOuts = Math.max(0, stats.totalConnections - stats.totalHits);
  return { strikeouts, fieldedOuts };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-foreground text-2xl font-bold">{value}</Text>
      <Text variant="muted" className="text-md">
        {label}
      </Text>
    </View>
  );
}

function BatterStatsRow({ stats }: { stats: MvpBatterStats }) {
  const battingAvg = stats.totalAtBats > 0 ? stats.totalHits / stats.totalAtBats : 0;

  return (
    <View className="flex-row flex-wrap justify-between gap-y-3 mx-2">
      <Stat label="AB" value={String(stats.totalAtBats)} />
      <Stat label="AVG" value={battingAvg.toFixed(3).replace(/^0/, '')} />
      <Stat label="R" value={String(stats.totalRuns)} />
      <Stat label="RBI" value={String(stats.totalRbi)} />
      <Stat label="HR" value={String(stats.totalHomeRuns)} />
    </View>
  );
}

function PitcherStatsRow({ stats }: { stats: MvpPitcherStats }) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-3 mx-4">
      <Stat label="IP" value={stats.totalInningsPitched?.toFixed(1) ?? '--'} />
      <Stat label="BF" value={String(stats.totalBattersFaced)} />
      <Stat label="ERA" value={stats.era?.toFixed(2) ?? '--'} />
      <Stat label="WHIP" value={stats.whip?.toFixed(2) ?? '--'} />
    </View>
  );
}

function BatterStatLine({ stats }: { stats: MvpBatterStats }) {
  const { colors, colorScheme } = useTheme();
  const atBats = stats.totalAtBats || 1;
  const { strikeouts, fieldedOuts } = deriveBatterOutcomeCounts(stats);

  const hitShades = getShadeSequence(colors.level1, 4, colorScheme);
  const outShades = getShadeSequence(colors.level3, 2, colorScheme);

  const segments = [
    { key: '1B', percent: stats.totalSingles / atBats, color: hitShades[0] },
    { key: '2B', percent: stats.totalDoubles / atBats, color: hitShades[1] },
    { key: '3B', percent: stats.totalTriples / atBats, color: hitShades[2] },
    { key: 'HR', percent: stats.totalHomeRuns / atBats, color: hitShades[3] },
    { key: 'BB', percent: stats.totalWalks / atBats, color: colors.level2 },
    { key: 'K', percent: strikeouts / atBats, color: outShades[1] },
    { key: 'FO', percent: fieldedOuts / atBats, color: outShades[0] },
  ];

  return (
    <View className="mt-5">
      <ProfileStatBar segments={segments.map(({ percent, color }) => ({ percent, color }))} />
      <ProfileStatLegend
        items={segments.map(({ key, percent, color }) => ({
          label: key,
          value: `${(percent * 100).toFixed(0)}%`,
          color,
        }))}
      />
    </View>
  );
}

function PitcherStatLine({ stats }: { stats: MvpPitcherStats }) {
  const { colors } = useTheme();
  const battersFaced = stats.totalBattersFaced || 1;

  const segments = [
    { key: 'K', percent: stats.totalOutsRecorded / battersFaced, color: colors.level1 },
    { key: 'H', percent: stats.totalHitsAllowed / battersFaced, color: colors.level3 },
    { key: 'BB', percent: stats.totalWalksAllowed / battersFaced, color: colors.level2 },
  ];

  return (
    <View className="mt-5">
      <ProfileStatBar segments={segments.map(({ percent, color }) => ({ percent, color }))} />
      <ProfileStatLegend
        items={segments.map(({ key, percent, color }) => ({
          label: key,
          value: `${(percent * 100).toFixed(0)}%`,
          color,
        }))}
      />
    </View>
  );
}

export function ProfileMvpCard(props: ProfileMvpCardProps) {
  const { player, loading } = usePlayerSummary(props.stats.playerId);

  if (loading) {
    return <ProfileSkeleton variant="mvp" />;
  }

  return (
    <Card className="mx-4" onPress={() => router.push(`/(app)/player-database/${props.stats.playerId}`)}>
      <Text className="text-foreground mb-2 text-xl font-semibold">
        {props.type === 'batter' ? 'MVP Batter' : 'MVP Pitcher'}
      </Text>
      <View className="flex-row gap-4">
        <PlayerAvatar imageUrl={player?.imageUrl} width={64} />
        <View className="flex-1 justify-between">
          <Text className="text-foreground text-2xl font-semibold" numberOfLines={1}>
            {player?.name ?? 'Unknown Player'}
          </Text>
          {props.type === 'batter' ? <BatterStatsRow stats={props.stats} /> : <PitcherStatsRow stats={props.stats} />}
        </View>
      </View>
      {props.type === 'batter' ? <BatterStatLine stats={props.stats} /> : <PitcherStatLine stats={props.stats} />}
    </Card>
  );
}