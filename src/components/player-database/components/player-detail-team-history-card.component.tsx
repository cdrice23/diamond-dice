import type { PlayerTeamHistoryRow } from '@/components/player-database/hooks/use-player-detail.hook';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type PlayerDetailTeamHistoryCardProps = {
  teamHistory: PlayerTeamHistoryRow[];
};

function formatDuration(startYear: number, endYear: number): string {
  return startYear === endYear ? String(startYear) : `${startYear} - ${endYear}`;
}

function TeamHistoryRow({ stint }: { stint: PlayerTeamHistoryRow }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-primary text-lg font-semibold">{stint.team_name}</Text>
      <Text variant="muted" className="text-lg">
        {formatDuration(stint.start_year, stint.end_year)}
      </Text>
    </View>
  );
}

export function PlayerDetailTeamHistoryCard({ teamHistory }: PlayerDetailTeamHistoryCardProps) {
  if (teamHistory.length === 0) {
    return null;
  }

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Team History" />

      <View className="gap-2.5">
        {teamHistory.map((stint) => (
          <TeamHistoryRow key={`${stint.team_name}-${stint.start_year}`} stint={stint} />
        ))}
      </View>
    </Card>
  );
}