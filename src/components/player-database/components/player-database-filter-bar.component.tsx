import { PlayerDatabaseAdvancedFiltersModal } from '@/components/player-database/components/player-database-advanced-filters-modal.component';
import { PlayerDatabaseFilterChipButton } from '@/components/player-database/components/player-database-filter-chip-button.component';
import { PlayerDatabaseLevelFilterGroup } from '@/components/player-database/components/player-database-level-filter-group.component';
import { PlayerDatabasePositionFilterButton } from '@/components/player-database/components/player-database-position-filter-button.component';
import { PlayerDatabaseRosteredFilterButton } from '@/components/player-database/components/player-database-rostered-filter-button.component';
import { NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import type { PlayerDatabaseFilters } from '@/components/player-database/player-database.types';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { View } from 'react-native';

type PlayerDatabaseFilterBarProps = {
  filters: PlayerDatabaseFilters;
  onFiltersChange: (updater: (prev: PlayerDatabaseFilters) => PlayerDatabaseFilters) => void;
};

function buildAdvancedFiltersSummary(filters: PlayerDatabaseFilters): string {
  const parts: string[] = [];
  if (filters.debutYearFrom !== null || filters.debutYearTo !== null) parts.push('Dates');
  if (filters.teamIds.length > 0) parts.push('MLB Teams');
  if (filters.awardGroupLabels.length > 0) parts.push('Awards');
  return parts.length === 0 ? 'Advanced Filters' : `Advanced Filters - ${parts.join(', ')}`;
}

export function PlayerDatabaseFilterBar({ filters, onFiltersChange }: PlayerDatabaseFilterBarProps) {
  const { colorScheme } = useTheme();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const advancedActive =
    filters.debutYearFrom !== null ||
    filters.debutYearTo !== null ||
    filters.teamIds.length > 0 ||
    filters.awardGroupLabels.length > 0;

  return (
    <View className="gap-2 pb-3">
      <PlayerDatabaseLevelFilterGroup
        playerType={filters.playerType}
        onPlayerTypeChange={(playerType) => onFiltersChange((prev) => ({ ...prev, playerType }))}
        ratingLevels={filters.ratingLevels}
        onRatingLevelsChange={(ratingLevels) => onFiltersChange((prev) => ({ ...prev, ratingLevels }))}
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

      <PlayerDatabaseFilterChipButton
        label={buildAdvancedFiltersSummary(filters)}
        isActive={advancedActive}
        activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
        onPress={() => setIsAdvancedOpen(true)}
        accessibilityLabel="Open advanced filters"
        inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
        inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
        className="mx-4"
      />

      <PlayerDatabaseAdvancedFiltersModal
        visible={isAdvancedOpen}
        onDismiss={() => setIsAdvancedOpen(false)}
        filters={filters}
        onApply={(next) => onFiltersChange((prev) => ({ ...prev, ...next }))}
      />
    </View>
  );
}