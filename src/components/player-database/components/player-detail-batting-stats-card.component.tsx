import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type PlayerDetailBattingStatsCardProps = {
  player: PlayerDetail;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-foreground text-2xl font-bold">{value}</Text>
      <Text variant="muted" className="text-base">
        {label}
      </Text>
    </View>
  );
}

function formatAvg(value: number | null): string {
  if (value === null) return '—';
  return value.toFixed(3).replace(/^0/, '');
}

function formatCount(value: number | null): string {
  return value === null ? '—' : String(value);
}

export function PlayerDetailBattingStatsCard({ player }: PlayerDetailBattingStatsCardProps) {
  return (
    <Card className="mx-4">
      <Text className="text-foreground mb-3 text-xl font-semibold">Career Batting</Text>
      <View className="gap-4">
        <View className="flex-row justify-around">
          <StatCell label="PA" value={formatCount(player.mlb_career_pa)} />
          <StatCell label="AB" value={formatCount(player.mlb_career_at_bats)} />
        </View>
        <View className="flex-row justify-around">
          <StatCell label="AVG" value={formatAvg(player.mlb_career_avg)} />
          <StatCell label="OBP" value={formatAvg(player.mlb_career_obp)} />
          <StatCell label="OPS" value={formatAvg(player.mlb_career_ops)} />
        </View>
        <View className="flex-row justify-around">
          <StatCell label="H" value={formatCount(player.mlb_career_hits)} />
          <StatCell label="R" value={formatCount(player.mlb_career_runs)} />
          <StatCell label="RBI" value={formatCount(player.mlb_career_rbi)} />
          <StatCell label="SB" value={formatCount(player.mlb_career_sb)} />
        </View>
      </View>
    </Card>
  );
}