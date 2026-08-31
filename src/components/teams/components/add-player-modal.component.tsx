import { PlayerDatabaseFilterBar } from '@/components/player-database/components/player-database-filter-bar.component';
import { PlayerDatabaseRowSkeleton } from '@/components/player-database/components/player-database-row-skeleton.component';
import { PlayerDatabaseRow } from '@/components/player-database/components/player-database-row.component';
import { PlayerDatabaseSearchInput } from '@/components/player-database/components/player-database-search-input.component';
import { usePlayerDatabaseSearch, type PlayerDatabaseRow as PlayerDatabaseRowData } from '@/components/player-database/hooks/use-player-database-search.hook';
import { DEFAULT_FILTERS } from '@/components/player-database/player-database.constants';
import type { PlayerDatabaseFilters, Position } from '@/components/player-database/player-database.types';
import { Text } from '@/components/primitives/text.component';
import { levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { POSITION_LABELS } from '../teams.constants';

export type AddPlayerModalSlotType = 'position' | 'pitcher';

type AddPlayerModalProps = {
  visible: boolean;
  slotType: AddPlayerModalSlotType;
  position?: Position;
  excludePlayerIds?: string[];
  onDismiss: () => void;
  onSelectPlayer: (player: PlayerDatabaseRowData) => void;
};

function buildInitialFilters(slotType: AddPlayerModalSlotType, position?: Position): PlayerDatabaseFilters {
  if (slotType === 'pitcher') {
    return { ...DEFAULT_FILTERS, playerType: 'pitcher', positions: ['P'] };
  }
  return { ...DEFAULT_FILTERS, playerType: 'batter', positions: position === 'DH' ? [] : position ? [position] : [] };
}

function modalTitle(slotType: AddPlayerModalSlotType, position?: Position): string {
  if (slotType === 'pitcher') return 'Add Pitcher';
  if (position === 'DH') return 'Add Designated Hitter';
  return `Add ${position}`;
}

export function AddPlayerModal({
  visible,
  slotType,
  position,
  excludePlayerIds = [],
  onDismiss,
  onSelectPlayer,
}: AddPlayerModalProps) {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PlayerDatabaseFilters>(() => buildInitialFilters(slotType, position));

  const { players, loading, loadingMore, hasMore, loadMore } = usePlayerDatabaseSearch(searchTerm, filters);
  const visiblePlayers = players.filter((player) => !excludePlayerIds.includes(player.id));
  const disablePositions = !(slotType === 'position' && position === 'DH');

  function handleSelect(player: PlayerDatabaseRowData) {
    onSelectPlayer(player);
    onDismiss();
  }

  function modalTitle(slotType: AddPlayerModalSlotType, position?: Position): string {
    if (slotType === 'pitcher') return 'Add Pitcher';
    return `Add ${position ? POSITION_LABELS[position] : ''}`;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-16">
          <Text className="text-foreground text-2xl font-bold">{modalTitle(slotType, position)}</Text>
          <Pressable onPress={onDismiss} className="p-1 active:opacity-60" accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={colors.foreground} />
          </Pressable>
        </View>

        <PlayerDatabaseSearchInput onSearchTermChange={setSearchTerm} />
        <PlayerDatabaseFilterBar filters={filters} onFiltersChange={setFilters} disablePlayerType disablePositions={disablePositions} />

        <FlatList
          data={visiblePlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <PlayerDatabaseRow
              id={item.id}
              name={item.name}
              eligiblePositions={item.eligible_positions}
              isQualifiedBatter={item.is_qualified_batter}
              isQualifiedPitcher={item.is_qualified_pitcher}
              levelDisplay={`Lvl. ${(slotType === 'pitcher' ? item.pitching_rating_level : item.batting_rating_level) ?? '--'}`}
              levelColor={levelColor(slotType === 'pitcher' ? item.pitching_rating_level : item.batting_rating_level, colors)}
              isFirst={index === 0}
              indexInBatch={item.indexInBatch}
              animate={false}
              onPress={() => handleSelect(item)}
            />
          )}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            loading ? (
              <View>
                {Array.from({ length: 6 }).map((_, i) => (
                  <PlayerDatabaseRowSkeleton key={i} isFirst={i === 0} animate={false} />
                ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text variant="muted">No players found</Text>
              </View>
            )
          }
          ListFooterComponent={loadingMore ? <PlayerDatabaseRowSkeleton animate={false} /> : null}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        />
      </View>
    </Modal>
  );
}