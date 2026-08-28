import { PlayerDatabaseFilterChipButton } from '@/components/player-database/components/player-database-filter-chip-button.component';
import { NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export type TeamsSortDirection = 'asc' | 'desc';

type TeamsFilterBarProps = {
  sortDirection: TeamsSortDirection;
  onSortDirectionChange: (direction: TeamsSortDirection) => void;
  formatLabel: string;
  onFormatFilterPress: () => void;
  formatFilterActive: boolean;
};

export function TeamsFilterBar({
  sortDirection,
  onSortDirectionChange,
  formatLabel,
  onFormatFilterPress,
  formatFilterActive,
}: TeamsFilterBarProps) {
  const { colorScheme } = useTheme();

  function toggleSort() {
    onSortDirectionChange(sortDirection === 'desc' ? 'asc' : 'desc');
  }

  return (
    <View className="gap-2 pb-3">
      <View className="flex-row gap-2 px-4">
        <PlayerDatabaseFilterChipButton
          label="Last Updated"
          isActive={false}
          activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
          onPress={toggleSort}
          accessibilityLabel="Toggle sort direction"
          inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
          inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
          leading={
            <Ionicons
              name={sortDirection === 'desc' ? 'arrow-down' : 'arrow-up'}
              size={14}
              color={NEUTRAL_FILTER_COLOR[colorScheme]}
            />
          }
          fullWidth
          className="flex-[1]"
        />

        <PlayerDatabaseFilterChipButton
          label={formatLabel}
          isActive={formatFilterActive}
          activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
          onPress={onFormatFilterPress}
          accessibilityLabel="Open format filter"
          inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
          inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
          trailing={
            <Ionicons
              name="chevron-down"
              size={14}
              color={formatFilterActive ? '#FFFFFF' : NEUTRAL_FILTER_COLOR[colorScheme]}
            />
          }
          fullWidth
          className="flex-[1.5]"
        />
      </View>
    </View>
  );
}