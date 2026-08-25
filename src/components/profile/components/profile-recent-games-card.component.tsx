import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import type { RecentGameSummary } from '@/components/profile/profile.types';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

type ProfileRecentGamesCardProps = {
  games: RecentGameSummary[];
};

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (date.getFullYear() < now.getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString(undefined, options);
}

function GameRow({ game, winColor, lossColor }: { game: RecentGameSummary; winColor: string; lossColor: string }) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/stats/${game.gameId}`)}
      className="flex-row items-center justify-between py-2 active:opacity-70"
      accessibilityRole="button"
    >
      <Text variant="muted" className="w-20 text-lg">
        {formatShortDate(game.playedAt)}
      </Text>
      <Chip
        label={game.isWin ? 'Win' : 'Loss'}
        backgroundColor={game.isWin ? winColor : lossColor}
        className="w-10 mr-2"
      />
      <Text className="text-foreground w-4 text-center text-lg">{game.isHome ? 'v' : '@'}</Text>
      <Text className="text-foreground flex-1 text-lg" numberOfLines={1}>
        {game.opponentName}
      </Text>
      <Text className="text-foreground font-semibold text-lg">
        {game.profileScore}-{game.opponentScore}
      </Text>
    </Pressable>
  );
}

export function ProfileRecentGamesCard({ games }: ProfileRecentGamesCardProps) {
  const { colors } = useTheme();

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Recent Games" />
      {games.slice(0, 5).map((game, index) => (
        <View key={game.gameId} className={index > 0 ? 'border-border border-t' : undefined}>
          <GameRow game={game} winColor={colors.level1} lossColor={colors.level3} />
        </View>
      ))}
    </Card>
  );
}