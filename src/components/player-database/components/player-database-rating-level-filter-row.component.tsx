import { NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { PlayerDatabaseFilterChipButton } from './player-database-filter-chip-button.component';

type PlayerDatabaseRatingLevelFilterRowProps = {
  value: (1 | 2 | 3)[];
  onChange: (next: (1 | 2 | 3)[]) => void;
};

const LEVELS: (1 | 2 | 3)[] = [1, 2, 3];
const MUTED_BACKGROUND_ALPHA = 0.15;
const MUTED_BORDER_ALPHA = 0.35;

export function PlayerDatabaseRatingLevelFilterRow({ value, onChange }: PlayerDatabaseRatingLevelFilterRowProps) {
  const { colors, colorScheme } = useTheme();

  function toggleLevel(level: 1 | 2 | 3) {
    onChange(value.includes(level) ? value.filter((l) => l !== level) : ([...value, level].sort() as (1 | 2 | 3)[]));
  }

  function levelColor(level: 1 | 2 | 3): string {
    if (level === 1) return colors.level1;
    if (level === 2) return colors.level2;
    return colors.level3;
  }

  const allSelected = value.length === LEVELS.length;
  const neutralColor = NEUTRAL_FILTER_COLOR[colorScheme];
  const neutralMuted = NEUTRAL_FILTER_COLOR_MUTED[colorScheme];

  return (
    <View className="flex-row gap-2 px-4">
      {LEVELS.map((level) => {
        const isOn = value.includes(level);
        const color = levelColor(level);
        return (
          <PlayerDatabaseFilterChipButton
            key={level}
            label={`Level ${level}`}
            isActive={isOn}
            activeColor={color}
            onPress={() => toggleLevel(level)}
            accessibilityLabel={`Level ${level} filter, ${isOn ? 'enabled' : 'disabled'}`}
            trailing={!isOn ? <Ionicons name="remove-circle" size={14} color={color} /> : undefined}
            inactiveBackgroundColor={adjustHslAlpha(color, MUTED_BACKGROUND_ALPHA)}
            inactiveTextColor={color}
            inactiveBorderColor={adjustHslAlpha(color, MUTED_BORDER_ALPHA)}
            fullWidth
          />
        );
      })}
      <PlayerDatabaseFilterChipButton
        label="All"
        isActive={allSelected}
        activeColor={neutralColor}
        onPress={() => onChange([...LEVELS])}
        accessibilityLabel={`Select all levels, currently ${allSelected ? 'all selected' : 'partial selection'}`}
        inactiveBackgroundColor={neutralMuted}
        inactiveTextColor={neutralColor}
        inactiveBorderColor={neutralMuted}
        fullWidth
      />
    </View>
  );
}