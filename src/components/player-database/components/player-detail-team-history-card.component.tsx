import type { PlayerTeamHistoryRow } from '@/components/player-database/hooks/use-player-detail.hook';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
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

      <View className="gap-2.5">
        {teamHistory.map((stint, index) => (
          <AnimatedCascadeItem
            key={`${stint.team_name}-${stint.start_year}`}
            index={index}
            staggerDelayMs={25}
            fadeDurationMs={300}
            translateYStart={6}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text className="text-primary text-lg font-semibold">{stint.team_name}</Text>
            <Text variant="muted" className="text-lg">
              {formatDuration(stint.start_year, stint.end_year)}
            </Text>
          </AnimatedCascadeItem>
        ))}
      </View>
    </Card>
  );
}