import { Card } from '@/components/primitives/card.component';
import { RecentGamesList, type RecentGameRow } from '@/components/primitives/recent-games-list.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';

type TeamDetailRecentGamesCardProps = {
  games: RecentGameRow[];
  bandColor: string;
  textColor: string;
};

export function TeamDetailRecentGamesCard({ games, bandColor, textColor }: TeamDetailRecentGamesCardProps) {
  if (games.length === 0) {
    return null;
  }

  return (
    <Card className="mx-4">
      <TeamDetailCardHeader label="Recent Games" bandColor={bandColor} textColor={textColor} />
      <RecentGamesList games={games} />
    </Card>
  );
}