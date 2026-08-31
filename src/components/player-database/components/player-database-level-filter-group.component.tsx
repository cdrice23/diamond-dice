import type { PlayerType } from '@/components/player-database/player-database.types';
import { adjustHslAlpha, levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { PlayerDatabaseFilterChipButton } from './player-database-filter-chip-button.component';
import { PlayerDatabasePlayerTypeFilterButton } from './player-database-player-type-filter-button.component';

type PlayerDatabaseLevelFilterGroupProps = {
  playerType: PlayerType;
  onPlayerTypeChange: (next: PlayerType) => void;
  ratingLevels: (1 | 2 | 3)[];
  onRatingLevelsChange: (next: (1 | 2 | 3)[]) => void;
  disablePlayerType?: boolean;
};

const LEVELS: (1 | 2 | 3)[] = [1, 2, 3];
const MUTED_BACKGROUND_ALPHA = 0.15;
const MUTED_BORDER_ALPHA = 0.35;

export function PlayerDatabaseLevelFilterGroup({
  playerType,
  onPlayerTypeChange,
  ratingLevels,
  onRatingLevelsChange,
  disablePlayerType = false,
}: PlayerDatabaseLevelFilterGroupProps) {
  const { colors } = useTheme();

  function toggleLevel(level: 1 | 2 | 3) {
    onRatingLevelsChange(
      ratingLevels.includes(level) ? ratingLevels.filter((l) => l !== level) : ([...ratingLevels, level].sort() as (1 | 2 | 3)[])
    );
  }

  return (
    <View className="flex-row gap-2 px-4">
      <View style={{ flex: 1 }}>
        <PlayerDatabasePlayerTypeFilterButton value={playerType} onChange={onPlayerTypeChange} disabled={disablePlayerType} />
      </View>

      {LEVELS.map((level) => {
        const isOn = ratingLevels.includes(level);
        const color = levelColor(level, colors);
        return (
          <View key={level} style={{ flex: 1 }}>
            <PlayerDatabaseFilterChipButton
              label={`Level ${level}`}
              isActive={isOn}
              activeColor={color}
              onPress={() => toggleLevel(level)}
              accessibilityLabel={`Level ${level} filter, ${isOn ? 'enabled' : 'disabled'}`}
              trailing={!isOn ? <Ionicons name="remove-circle" size={14} color={color} /> : undefined}
              inactiveBackgroundColor={adjustHslAlpha(color, MUTED_BACKGROUND_ALPHA)}
              inactiveBorderColor={adjustHslAlpha(color, MUTED_BORDER_ALPHA)}
              fullWidth
            />
          </View>
        );
      })}
    </View>
  );
}