import type { FormatLevelRequirement } from '../hooks/use-format-roster-requirements.hook';

export type LevelCountStatus = 'under' | 'ok' | 'over';

export type LevelCountSummary = {
  level: number | null;
  count: number;
  status: LevelCountStatus;
};

export function computeVisibleLevelCounts(
  requirements: FormatLevelRequirement[],
  playerType: 'batter' | 'pitcher',
  filledLevels: number[]
): LevelCountSummary[] {
  const rows = requirements.filter((req) => req.playerType === playerType);
  const activeRowCount = rows.filter((req) => req.minCount > 0).length;

  return rows.reduce<LevelCountSummary[]>((summaries, row) => {
    const count = row.level === null ? filledLevels.length : filledLevels.filter((l) => l === row.level).length;
    const isActive = row.minCount > 0;
    const exceeded = row.maxCount !== null && count > row.maxCount;
    const underMin = count < row.minCount;
    const isDominantSingleLevel = isActive && activeRowCount === 1;

    if (isDominantSingleLevel) return summaries;
    if (count === 0 && !isActive) return summaries;

    summaries.push({ level: row.level, count, status: exceeded ? 'over' : underMin ? 'under' : 'ok' });
    return summaries;
  }, []);
}

export type PitcherSlotRange = {
  min: number;
  max: number | null;
};

export function computePitcherSlotRange(requirements: FormatLevelRequirement[]): PitcherSlotRange {
  const rows = requirements.filter((req) => req.playerType === 'pitcher');
  const aggregateRow = rows.find((req) => req.level === null);

  if (aggregateRow) {
    return { min: aggregateRow.minCount, max: aggregateRow.maxCount };
  }

  const min = rows.reduce((sum, req) => sum + req.minCount, 0);
  const hasUnboundedMax = rows.some((req) => req.maxCount === null);
  const max = hasUnboundedMax ? null : rows.reduce((sum, req) => sum + (req.maxCount ?? 0), 0);

  return { min, max };
}