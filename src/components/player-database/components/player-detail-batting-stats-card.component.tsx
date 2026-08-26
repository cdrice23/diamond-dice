import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { ScrollView, View } from 'react-native';

type PlayerDetailBattingStatsCardProps = {
  player: PlayerDetail;
};

function formatCount(value: number | null): string {
  return value === null ? '—' : String(value);
}

function StatCell({ label, value, isFirst }: { label: string; value: string; isFirst: boolean }) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center">
      {!isFirst && <View className="mr-4 h-8 w-px" style={{ backgroundColor: colors.border }} />}
      <View className="items-center gap-0.5">
        <Text style={{ color: colors.primary }} className="text-xl font-bold">
          {value}
        </Text>
        <Text variant="muted" className="text-xs">
          {label}
        </Text>
      </View>
    </View>
  );
}

export function PlayerDetailBattingStatsCard({ player }: PlayerDetailBattingStatsCardProps) {
  const stats = [
    { label: 'PA', value: formatCount(player.mlb_career_pa) },
    { label: 'AB', value: formatCount(player.mlb_career_at_bats) },
    { label: 'H', value: formatCount(player.mlb_career_hits) },
    { label: 'R', value: formatCount(player.mlb_career_runs) },
    { label: 'RBI', value: formatCount(player.mlb_career_rbi) },
    { label: 'SB', value: formatCount(player.mlb_career_sb) },
  ];

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Career Batting" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-0.5">
        {stats.map((stat, index) => (
          <StatCell key={stat.label} label={stat.label} value={stat.value} isFirst={index === 0} />
        ))}
      </ScrollView>
    </Card>
  );
}