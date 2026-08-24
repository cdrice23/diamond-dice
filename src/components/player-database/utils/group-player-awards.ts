import { AWARD_GROUPS } from '@/components/player-database/player-database.constants';
import type { PlayerAwardRow, PlayerAwardSummary } from '@/components/player-database/player-database.types';

export function groupPlayerAwards(rows: PlayerAwardRow[]): PlayerAwardSummary[] {
  const externalIdToGroup = new Map<string, (typeof AWARD_GROUPS)[number]>();
  for (const group of AWARD_GROUPS) {
    for (const externalId of group.externalIds) {
      externalIdToGroup.set(externalId, group);
    }
  }

  const byLabel = new Map<string, { seasons: number[]; magnitudeRank: number; tier: 'level1' | 'level2' | 'level3' }>();
  for (const row of rows) {
    const group = externalIdToGroup.get(row.award_external_id);
    if (!group) continue;

    const entry = byLabel.get(group.label) ?? { seasons: [], magnitudeRank: group.magnitudeRank, tier: group.tier };
    entry.seasons.push(row.season);
    byLabel.set(group.label, entry);
  }

  const summaries: PlayerAwardSummary[] = Array.from(byLabel.entries()).map(([label, { seasons, magnitudeRank, tier }]) => ({
    label,
    count: seasons.length,
    seasons: seasons.sort((a, b) => a - b),
    magnitudeRank,
    tier,
  }));

  return summaries.sort((a, b) => a.magnitudeRank - b.magnitudeRank);
}