import { useTheme } from '@/utils/theme-provider';

export function getAwardTierColor(tier: 'level1' | 'level2' | 'level3', colors: ReturnType<typeof useTheme>['colors']): string {
  if (tier === 'level1') return colors.level1;
  if (tier === 'level2') return colors.level2;
  return colors.level3;
}