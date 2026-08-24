import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type PlayerDetailPitchingStatsCardProps = {
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

function formatDecimal(value: number | null, digits: number): string {
  return value === null ? '—' : value.toFixed(digits);
}

function formatCount(value: number | null): string {
  return value === null ? '—' : String(value);
}

function formatRecord(wins: number | null, losses: number | null): string {
  if (wins === null || losses === null) return '—';
  return `${wins}-${losses}`;
}

export function PlayerDetailPitchingStatsCard({ player }: PlayerDetailPitchingStatsCardProps) {
  return (
    <Card className="mx-4">
      <Text className="text-foreground mb-3 text-xl font-semibold">Career Pitching</Text>
      <View className="gap-4">
        <View className="flex-row justify-around">
          <StatCell label="IP" value={formatDecimal(player.mlb_career_innings_pitched, 1)} />
          <StatCell label="W-L" value={formatRecord(player.mlb_career_wins, player.mlb_career_losses)} />
        </View>
        <View className="flex-row justify-around">
          <StatCell label="ERA" value={formatDecimal(player.mlb_career_era, 2)} />
          <StatCell label="WHIP" value={formatDecimal(player.mlb_career_whip, 2)} />
          <StatCell label="K" value={formatCount(player.mlb_career_strikeouts)} />
          <StatCell label="SV" value={formatCount(player.mlb_career_saves)} />
        </View>
      </View>
    </Card>
  );
}