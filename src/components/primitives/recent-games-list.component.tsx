import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

export type RecentGameRow = {
  gameId: string;
  playedAt: string;
  isHome: boolean;
  isWin: boolean;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
};

type RecentGamesListProps = {
  games: RecentGameRow[];
};

type RowItem = { type: 'divider'; year: number } | { type: 'game'; game: RecentGameRow };

function formatShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function groupGamesWithYearDividers(games: RecentGameRow[]): RowItem[] {
  const items: RowItem[] = [];
  const currentYear = new Date().getFullYear();
  let lastYear: number | null = null;

  for (const game of games) {
    const year = new Date(game.playedAt).getFullYear();
    if (year !== lastYear && year !== currentYear) {
      items.push({ type: 'divider', year });
    }
    lastYear = year;
    items.push({ type: 'game', game });
  }

  return items;
}

function YearDivider({ year }: { year: number }) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center gap-3 py-1">
      <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
      <Text variant="muted" className="text-sm font-semibold">
        {year}
      </Text>
      <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
    </View>
  );
}

function GameRow({
  game,
  winColor,
  lossColor,
  index,
}: {
  game: RecentGameRow;
  winColor: string;
  lossColor: string;
  index: number;
}) {
  return (
    <AnimatedCascadeItem index={index} staggerDelayMs={25} fadeDurationMs={300} translateYStart={6}>
      <Pressable
        onPress={() => router.push(`/(app)/stats/${game.gameId}`)}
        className="flex-row items-center gap-2.5 active:opacity-70"
        accessibilityRole="button"
      >
        <Text variant="muted" className="w-12 text-lg" numberOfLines={1}>
          {formatShortDate(game.playedAt)}
        </Text>

        <Chip label={game.isWin ? 'Win' : 'Loss'} backgroundColor={game.isWin ? winColor : lossColor} shape="square" className="w-10" />

        <Text className="text-primary flex-1 text-lg font-semibold" numberOfLines={1}>
          {game.isHome ? 'v' : '@'} {game.opponentName}
        </Text>

        <Text className="text-foreground text-lg font-semibold">
          {game.teamScore}-{game.opponentScore}
        </Text>
      </Pressable>
    </AnimatedCascadeItem>
  );
}

export function RecentGamesList({ games }: RecentGamesListProps) {
  const { colors } = useTheme();
  const items = groupGamesWithYearDividers(games.slice(0, 5));

  let gameIndex = 0;

  return (
    <View className="gap-2.5">
      {items.map((item) => {
        if (item.type === 'divider') {
          return <YearDivider key={`divider-${item.year}`} year={item.year} />;
        }

        const index = gameIndex;
        gameIndex += 1;
        return (
          <GameRow key={item.game.gameId} game={item.game} winColor={colors.level1} lossColor={colors.level3} index={index} />
        );
      })}
    </View>
  );
}