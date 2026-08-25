export function getAwardSeasonRuns(seasons: number[]): string[] {
  if (seasons.length === 0) return [];

  const sorted = [...seasons].sort((a, b) => a - b);

  const runs: number[][] = [];
  let currentRun: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const isConsecutive = sorted[i] === sorted[i - 1] + 1;
    if (isConsecutive) {
      currentRun.push(sorted[i]);
    } else {
      runs.push(currentRun);
      currentRun = [sorted[i]];
    }
  }
  runs.push(currentRun);

  return runs.map((run) => (run.length > 1 ? `${run[0]}–${run[run.length - 1]}` : `${run[0]}`));
}

export function getCollapsedSeasonSummary(seasons: number[]): { label: string; isTruncatable: boolean } {
  const sorted = [...seasons].sort((a, b) => a - b);
  const isTruncatable = sorted.length >= 3;

  if (!isTruncatable) {
    return { label: sorted.join(', '), isTruncatable: false };
  }

  const visible = sorted.slice(0, 2);
  const remaining = sorted.length - visible.length;
  return { label: `${visible.join(', ')}, +${remaining} more`, isTruncatable: true };
}

export function getAllSeasonsList(seasons: number[]): string {
  return [...seasons].sort((a, b) => a - b).join(', ');
}