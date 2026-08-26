import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';

export type StatCurveGroup = 'batting' | 'pitching';

export type StatCurveConfig = {
  key: string;
  label: string;
  fullLabel: string;
  description: string;
  group: StatCurveGroup;
  higherIsBetter: boolean;
  format: (value: number) => string;
  getValue: (player: PlayerDetail) => number | null;
};

function formatRate3(value: number): string {
  return value.toFixed(3).replace(/^0/, '');
}

function formatDecimal2(value: number): string {
  return value.toFixed(2);
}

function formatDecimal1(value: number): string {
  return value.toFixed(1);
}

function safeRatePer(numerator: number | null, denominator: number | null, per: number): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return (numerator / denominator) * per;
}

export const STAT_CURVE_CONFIGS: StatCurveConfig[] = [
  {
    key: 'avg',
    label: 'AVG',
    fullLabel: 'Batting Average',
    description: 'Hits per at-bat, the classic measure of how often a batter reaches base by hitting safely.',
    group: 'batting',
    higherIsBetter: true,
    format: formatRate3,
    getValue: (p) => p.mlb_career_avg,
  },
  {
    key: 'obp',
    label: 'OBP',
    fullLabel: 'On-Base Percentage',
    description: 'How often a batter reaches base by any means — hits, walks, or being hit by a pitch.',
    group: 'batting',
    higherIsBetter: true,
    format: formatRate3,
    getValue: (p) => p.mlb_career_obp,
  },
  {
    key: 'ops',
    label: 'OPS',
    fullLabel: 'On-Base + Slugging',
    description: 'Combines a batter\u2019s ability to reach base with their raw power at the plate.',
    group: 'batting',
    higherIsBetter: true,
    format: formatRate3,
    getValue: (p) => p.mlb_career_ops,
  },
  {
    key: 'rbi_rate',
    label: 'RBI/650',
    fullLabel: 'RBI Rate',
    description: 'Run-production rate, scaled to a typical full season of plate appearances (650).',
    group: 'batting',
    higherIsBetter: true,
    format: formatDecimal1,
    getValue: (p) => safeRatePer(p.mlb_career_rbi, p.mlb_career_pa, 650),
  },
  {
    key: 'run_rate',
    label: 'R/650',
    fullLabel: 'Runs Rate',
    description: 'How often a batter scores, scaled to a typical full season of plate appearances (650).',
    group: 'batting',
    higherIsBetter: true,
    format: formatDecimal1,
    getValue: (p) => safeRatePer(p.mlb_career_runs, p.mlb_career_pa, 650),
  },
  {
    key: 'sb_rate',
    label: 'SB/650',
    fullLabel: 'Stolen Base Rate',
    description: 'Base-stealing rate, scaled to a typical full season of plate appearances (650).',
    group: 'batting',
    higherIsBetter: true,
    format: formatDecimal1,
    getValue: (p) => safeRatePer(p.mlb_career_sb, p.mlb_career_pa, 650),
  },
  {
    key: 'era',
    label: 'ERA',
    fullLabel: 'Earned Run Average',
    description: 'Earned runs allowed per nine innings \u2014 lower values means a pitcher limits scoring more effectively.',
    group: 'pitching',
    higherIsBetter: false,
    format: formatDecimal2,
    getValue: (p) => p.mlb_career_era,
  },
  {
    key: 'whip',
    label: 'WHIP',
    fullLabel: 'Walks + Hits per Inning Pitched',
    description: 'How many baserunners a pitcher allows per inning \u2014 lower value reflects tighter control.',
    group: 'pitching',
    higherIsBetter: false,
    format: formatDecimal2,
    getValue: (p) => p.mlb_career_whip,
  },
  {
    key: 'k_per_9',
    label: 'K/9',
    fullLabel: 'Strikeouts per 9 Innings',
    description: 'How often a pitcher strikes batters out, scaled to a full nine-inning game.',
    group: 'pitching',
    higherIsBetter: true,
    format: formatDecimal1,
    getValue: (p) => safeRatePer(p.mlb_career_strikeouts, p.mlb_career_innings_pitched, 9),
  },
];

export function getStatCurveConfigsForGroup(group: StatCurveGroup): StatCurveConfig[] {
  return STAT_CURVE_CONFIGS.filter((config) => config.group === group);
}