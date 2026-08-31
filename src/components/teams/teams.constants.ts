import type { Position } from '@/components/player-database/player-database.types';
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";

export const FORMAT_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Standard: 'baseball',
  Sandlot: 'fence',
  'Scrub League': 'account-hard-hat',
  Journeyman: 'briefcase-outline',
  'Elite Ball': 'trophy-outline',
  Bullpen: 'baseball-bat',
};

export const FORMAT_LEVEL_MAP: Record<string, 1 | 2 | 3 | null> = {
  Standard: null,
  Sandlot: null,
  'Scrub League': 1,
  Journeyman: 2,
  'Elite Ball': 3,
  Bullpen: null,
};

export const POSITION_LABELS: Record<Position, string> = {
  C: 'Catcher',
  '1B': 'First Baseman',
  '2B': 'Second Baseman',
  '3B': 'Third Baseman',
  SS: 'Shortstop',
  OF: 'Outfielder',
  DH: 'Designated Hitter',
  P: 'Pitcher',
};