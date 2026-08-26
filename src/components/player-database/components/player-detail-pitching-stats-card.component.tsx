import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

type PlayerDetailPitchingStatsCardProps = {
  player: PlayerDetail;
};

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

function StatCell({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View className="flex-1 items-center gap-0.5">
      <Text style={{ color: colors.primary }} className="text-xl font-bold">
        {value}
      </Text>
      <Text variant="muted" className="text-xs">
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  const { colors } = useTheme();
  return <View className="h-8 w-px" style={{ backgroundColor: colors.border }} />;
}

export function PlayerDetailPitchingStatsCard({ player }: PlayerDetailPitchingStatsCardProps) {
  const stats = [
    { label: 'IP', value: formatDecimal(player.mlb_career_innings_pitched, 1) },
    { label: 'W-L', value: formatRecord(player.mlb_career_wins, player.mlb_career_losses) },
    { label: 'K', value: formatCount(player.mlb_career_strikeouts) },
    { label: 'SV', value: formatCount(player.mlb_career_saves) },
  ];

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Career Pitching" />
      <View className="flex-row items-center">
        {stats.map((stat, index) => (
          <View key={stat.label} className="flex-1 flex-row items-center justify-center">
            {index > 0 && <StatDivider />}
            <StatCell label={stat.label} value={stat.value} />
          </View>
        ))}
      </View>
    </Card>
  );
}