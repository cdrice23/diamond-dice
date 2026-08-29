export const FORMAT_ORDER = ['Standard', 'Sandlot', 'Scrub League', 'Journeyman', 'Elite Ball', 'Bullpen'];

const PURPLE_LIGHT = '#E2CFEA';
const PURPLE_DARK = '#A06CD5';

export function getFormatAccentColor(
  name: string,
  colors: { level1: string; level2: string; level3: string },
  colorScheme: 'light' | 'dark'
): string {
  switch (name) {
    case 'Scrub League':
      return colors.level1;
    case 'Journeyman':
      return colors.level2;
    case 'Elite Ball':
      return colors.level3;
    default:
      return colorScheme === 'dark' ? PURPLE_DARK : PURPLE_LIGHT;
  }
}

export const FORMAT_DESCRIPTIONS: Record<string, string> = {
  Standard: 'The classic balanced setup - similar to the physical Diamond Dice game.',
  Sandlot: 'No level restrictions on batters or pitchers — just play whoever you want!',
  'Scrub League': 'Level 1 players only - they are just glad to be in the Show!',
  Journeyman: 'Level 2 players only - these guys are pretty good.',
  'Elite Ball': 'Level 3 players only - featuring the best to ever do it.',
  Bullpen: 'No level restrictions, and pitchers rotate every inning - kind of like an All-Star Game team, but anyone is welcome.',
};