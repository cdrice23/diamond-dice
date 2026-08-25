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

export function PlayerDetailTeamHistoryCard({ teamHistory }: PlayerDetailTeamHistoryCardProps) {
  if (teamHistory.length === 0) {
    return null;
  }

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Team History" />
      {teamHistory.map((stint, index) => (
        <View
          key={`${stint.team_name}-${stint.start_year}`}
          className={`flex-row items-center justify-between py-3 ${index > 0 ? 'border-border border-t' : ''}`}
        >
          <Text className="text-foreground text-lg font-medium">{stint.team_name}</Text>
          <Text variant="muted" className="text-base">
            {formatDuration(stint.start_year, stint.end_year)}
          </Text>
        </View>
      ))}
    </Card>
  );
}