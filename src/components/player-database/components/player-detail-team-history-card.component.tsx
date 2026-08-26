import type { PlayerTeamHistoryRow } from '@/components/player-database/hooks/use-player-detail.hook';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { useCascadingFadeIn } from '@/components/profile/hooks/use-cascading-fade-in.hook';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

type PlayerDetailTeamHistoryCardProps = {
  teamHistory: PlayerTeamHistoryRow[];
};

function formatDuration(startYear: number, endYear: number): string {
  return startYear === endYear ? String(startYear) : `${startYear} - ${endYear}`;
}

function TeamHistoryRow({ stint, index }: { stint: PlayerTeamHistoryRow; index: number }) {
  const fadeStyle = useCascadingFadeIn(index, { staggerDelayMs: 25, fadeDurationMs: 300, translateYStart: 6 });

  return (
    <Animated.View style={fadeStyle} className="flex-row items-center justify-between">
      <Text className="text-primary text-lg font-semibold">{stint.team_name}</Text>
      <Text variant="muted" className="text-lg">
        {formatDuration(stint.start_year, stint.end_year)}
      </Text>
    </Animated.View>
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
        {teamHistory.map((stint, index) => (
          <TeamHistoryRow key={`${stint.team_name}-${stint.start_year}`} stint={stint} index={index} />
        ))}
      </View>
    </Card>
  );
}