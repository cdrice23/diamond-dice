import { PlayerDatabaseAdvancedFiltersModal } from '@/components/player-database/components/player-database-advanced-filters-modal.component';
import { PlayerDatabaseFilterChipButton } from '@/components/player-database/components/player-database-filter-chip-button.component';
import { PlayerDatabaseLevelFilterGroup } from '@/components/player-database/components/player-database-level-filter-group.component';
import { PlayerDatabasePositionFilterButton } from '@/components/player-database/components/player-database-position-filter-button.component';
import { PlayerDatabaseRosteredFilterButton } from '@/components/player-database/components/player-database-rostered-filter-button.component';
import { DEFAULT_FILTERS, NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import type { PlayerDatabaseFilters } from '@/components/player-database/player-database.types';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

type PlayerDatabaseFilterBarProps = {
  filters: PlayerDatabaseFilters;
  onFiltersChange: (updater: (prev: PlayerDatabaseFilters) => PlayerDatabaseFilters) => void;
  disablePlayerType?: boolean;
  disablePositions?: boolean;
  disableLevels?: boolean;
  baseFilters?: PlayerDatabaseFilters;
};

function arraysHaveSameMembers<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((item) => setB.has(item));
}

function buildAdvancedFiltersLabel(filters: PlayerDatabaseFilters): string {
  const parts: string[] = [];
  if (filters.debutYearFrom !== null || filters.debutYearTo !== null) parts.push('Dates');
  if (filters.teamIds.length > 0) parts.push('MLB Teams');
  if (filters.awardGroupLabels.length > 0) parts.push('Awards');
  return parts.length === 0 ? 'Advanced Filters' : parts.join(', ');
}

function isAnyFilterActive(filters: PlayerDatabaseFilters, base: PlayerDatabaseFilters): boolean {
  return (
    filters.playerType !== base.playerType ||
    !arraysHaveSameMembers(filters.ratingLevels, base.ratingLevels) ||
    !arraysHaveSameMembers(filters.positions, base.positions) ||
    filters.debutYearFrom !== base.debutYearFrom ||
    filters.debutYearTo !== base.debutYearTo ||
    !arraysHaveSameMembers(filters.teamIds, base.teamIds) ||
    !arraysHaveSameMembers(filters.awardGroupLabels, base.awardGroupLabels)
  );
}

export function PlayerDatabaseFilterBar({
  filters,
  onFiltersChange,
  disablePlayerType = false,
  disablePositions = false,
  disableLevels = false,
  baseFilters = DEFAULT_FILTERS,
}: PlayerDatabaseFilterBarProps) {
  const { colorScheme } = useTheme();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const advancedActive =
    filters.debutYearFrom !== null ||
    filters.debutYearTo !== null ||
    filters.teamIds.length > 0 ||
    filters.awardGroupLabels.length > 0;

  const anyFilterActive = isAnyFilterActive(filters, baseFilters);

  function handleClearAll() {
    onFiltersChange(() => baseFilters);
  }

  return (
    <View className="gap-2 pb-3">
      <PlayerDatabaseLevelFilterGroup
        playerType={filters.playerType}
        onPlayerTypeChange={(playerType) => onFiltersChange((prev) => ({ ...prev, playerType }))}
        ratingLevels={filters.ratingLevels}
        onRatingLevelsChange={(ratingLevels) => onFiltersChange((prev) => ({ ...prev, ratingLevels }))}
        disablePlayerType={disablePlayerType}
        disableLevels={disableLevels}
      />

      <View className="flex-row gap-2 px-4">
        <View style={{ flex: 2 }}>
          <PlayerDatabasePositionFilterButton
            value={filters.positions}
            onChange={(positions) => onFiltersChange((prev) => ({ ...prev, positions }))}
            disabled={disablePositions}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PlayerDatabaseRosteredFilterButton
            value={filters.isRostered}
            onChange={(isRostered) => onFiltersChange((prev) => ({ ...prev, isRostered }))}
          />
        </View>
      </View>

      <View className="flex-row gap-2 px-4">
        <View style={{ flex: 2 }}>
          <PlayerDatabaseFilterChipButton
            label={buildAdvancedFiltersLabel(filters)}
            isActive={advancedActive}
            activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
            onPress={() => setIsAdvancedOpen(true)}
            accessibilityLabel="Open advanced filters"
            inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
            inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
            trailing={<Ionicons name="chevron-down" size={14} color={advancedActive ? '#F7F7F7' : NEUTRAL_FILTER_COLOR[colorScheme]} />}
            className="w-full"
          />
        </View>
        <View style={{ flex: 1 }}>
          <PlayerDatabaseFilterChipButton
            label="Clear All"
            isActive={false}
            activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
            onPress={handleClearAll}
            accessibilityLabel="Clear all filters"
            inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
            inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
            disabled={!anyFilterActive}
            className="w-full"
          />
        </View>
      </View>

      <PlayerDatabaseAdvancedFiltersModal
        visible={isAdvancedOpen}
        onDismiss={() => setIsAdvancedOpen(false)}
        filters={filters}
        onApply={(next) => onFiltersChange((prev) => ({ ...prev, ...next }))}
      />
    </View>
  );
}