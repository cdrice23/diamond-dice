import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { RecentGamesList, type RecentGameRow } from '@/components/primitives/recent-games-list.component';

type ProfileRecentGamesCardProps = {
  games: RecentGameRow[];
};

export function ProfileRecentGamesCard({ games }: ProfileRecentGamesCardProps) {
  return (
    <Card className="mx-4">
      <CardSectionHeader label="Recent Games" />
      <RecentGamesList games={games} />
    </Card>
  );
}