import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { View } from 'react-native';

type TeamDetailStatsCardProps = {
  wins: number;
  losses: number;
  gamesPlayed: number;
  bandColor: string;
  textColor: string;
};

export function TeamDetailStatsCard({ wins, losses, gamesPlayed, bandColor, textColor }: TeamDetailStatsCardProps) {
  return (
    <Card className="mx-4">
      <TeamDetailCardHeader label="Stats" bandColor={bandColor} textColor={textColor} />

      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="text-foreground text-2xl font-bold">
            {wins}-{losses}
          </Text>
          <Text variant="muted" className="text-sm">
            W-L
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-foreground text-2xl font-bold">{gamesPlayed}</Text>
          <Text variant="muted" className="text-sm">
            Games Played
          </Text>
        </View>
      </View>

      <Text variant="muted" className="mt-3 text-center text-sm">
        More stats coming soon
      </Text>
    </Card>
  );
}