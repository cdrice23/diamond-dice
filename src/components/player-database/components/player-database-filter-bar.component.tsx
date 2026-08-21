import { PlayerDatabasePlayerTypeFilterButton } from '@/components/player-database/components/player-database-player-type-filter-button.component';
import { PlayerDatabasePositionFilterButton } from '@/components/player-database/components/player-database-position-filter-button.component';
import { PlayerDatabaseRatingLevelFilterRow } from '@/components/player-database/components/player-database-rating-level-filter-row.component';
import { PlayerDatabaseRosteredFilterButton } from '@/components/player-database/components/player-database-rostered-filter-button.component';
import type { PlayerDatabaseFilters } from '@/components/player-database/player-database.types';
import { View } from 'react-native';

type PlayerDatabaseFilterBarProps = {
  filters: PlayerDatabaseFilters;
  onFiltersChange: (updater: (prev: PlayerDatabaseFilters) => PlayerDatabaseFilters) => void;
};

export function PlayerDatabaseFilterBar({ filters, onFiltersChange }: PlayerDatabaseFilterBarProps) {
  return (
    <View className="gap-2 pb-3">
      <View className="px-4">
        <PlayerDatabasePlayerTypeFilterButton
          value={filters.playerType}
          onChange={(playerType) => onFiltersChange((prev) => ({ ...prev, playerType }))}
        />
      </View>

      <PlayerDatabaseRatingLevelFilterRow
        value={filters.ratingLevels}
        onChange={(ratingLevels) => onFiltersChange((prev) => ({ ...prev, ratingLevels }))}
      />

      <View className="flex-row gap-2 px-4">
        <View style={{ flex: 2 }}>
          <PlayerDatabasePositionFilterButton
            value={filters.positions}
            onChange={(positions) => onFiltersChange((prev) => ({ ...prev, positions }))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PlayerDatabaseRosteredFilterButton />
        </View>
      </View>
    </View>
  );
}