import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDatabaseRowSkeleton } from '@/components/player-database/components/player-database-row-skeleton.component';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { DeleteTeamConfirmationModal } from '@/components/teams/components/delete-team-confirmation-modal.component';
import { TeamsEmptyState } from '@/components/teams/components/teams-empty-state.component';
import { TeamsFilterBar, type TeamsSortDirection } from '@/components/teams/components/teams-filter-bar.component';
import { TeamsFormatFilterModal } from '@/components/teams/components/teams-format-filter-modal.component';
import { TeamsHeader } from '@/components/teams/components/teams-header.component';
import { TeamsListCard } from '@/components/teams/components/teams-list-card.component';
import { TeamsSearchInput } from '@/components/teams/components/teams-search-input.component';
import { useDeleteTeam } from '@/components/teams/hooks/use-delete-team.hook';
import { useTeamsList } from '@/components/teams/hooks/use-teams-list.hook';
import type { TeamSummary } from '@/components/teams/teams.types';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const NAV_CLEARANCE_EXTRA = 16;

export default function TeamsScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<TeamsSortDirection>('desc');
  const [formatId, setFormatId] = useState<string | null>(null);
  const [formatName, setFormatName] = useState<string | null>(null);
  const [formatFilterOpen, setFormatFilterOpen] = useState(false);
  const [teamPendingDeletion, setTeamPendingDeletion] = useState<TeamSummary | null>(null);

  const { teams, loading, loadingMore, hasMore, loadMore, refetch } = useTeamsList(searchTerm, formatId, sortDirection);
  const { deleteTeam, deleting, error: deleteError, clearError } = useDeleteTeam();

  const hasTriggeredMoreRef = useRef(false);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  const handleEndReached = useCallback(() => {
    if (hasTriggeredMoreRef.current) return;
    hasTriggeredMoreRef.current = true;
    loadMore().finally(() => {
      hasTriggeredMoreRef.current = false;
    });
  }, [loadMore]);

  function handleAddNewTeam() {
    router.push('/teams/new');
  }

  function handleTeamPress(team: TeamSummary) {
    router.push(`/teams/${team.id}`);
  }

  function handleEditTeam(team: TeamSummary) {
    router.push(`/teams/${team.id}/edit`);
  }

  function handleSelectFormatFilter(id: string | null, name: string | null) {
    setFormatId(id);
    setFormatName(name);
    setFormatFilterOpen(false);
  }

  function handleRequestDeleteTeam(team: TeamSummary) {
    clearError();
    setTeamPendingDeletion(team);
  }

  async function handleConfirmDeleteTeam() {
    if (!teamPendingDeletion) return;
    const success = await deleteTeam(teamPendingDeletion.id);
    if (success) {
      setTeamPendingDeletion(null);
      refetch();
    }
  }

  function handleCancelDeleteTeam() {
    if (deleting) return;
    setTeamPendingDeletion(null);
    clearError();
  }

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={40} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <TeamsHeader onAddTeamPress={handleAddNewTeam} />
        <TeamsSearchInput value={searchTerm} onChangeText={setSearchTerm} onSearchTermChange={setSearchTerm} />
        <TeamsFilterBar
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          formatLabel={formatName ?? 'Any Format'}
          formatFilterActive={formatId !== null}
          onFormatFilterPress={() => setFormatFilterOpen(true)}
          searchActive={searchTerm.trim() !== ''}
          onClearAll={() => {
            setFormatId(null);
            setFormatName(null);
            setSearchTerm('');
          }}
        />
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          {loading ? (
            <View className="px-4 pt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <PlayerDatabaseRowSkeleton key={i} isFirst={i === 0} indexInBatch={i} />
              ))}
            </View>
          ) : teams.length === 0 ? (
            <TeamsEmptyState isFiltered={searchTerm.trim() !== '' || formatId !== null} />
          ) : (
            <FlatList
              data={teams}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <AnimatedCascadeItem index={index} staggerDelayMs={100}>
                  <TeamsListCard
                    team={item}
                    onPress={() => handleTeamPress(item)}
                    onEditPress={() => handleEditTeam(item)}
                    onDeletePress={() => handleRequestDeleteTeam(item)}
                  />
                </AnimatedCascadeItem>
              )}
              onEndReached={hasMore ? handleEndReached : undefined}
              onEndReachedThreshold={0.5}
              removeClippedSubviews
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              ListFooterComponent={
                loadingMore ? (
                  <View className="px-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <PlayerDatabaseRowSkeleton key={i} isFirst={false} indexInBatch={i} />
                    ))}
                  </View>
                ) : null
              }
              contentContainerClassName="px-4 pb-6"
              contentContainerStyle={{ paddingTop: 32 }}
            />
          )}
          <PlayerDatabaseFadeList backgroundColor={colors.background} bottomInset={navClearance} />
        </View>
      </Animated.View>

      <DeleteTeamConfirmationModal
        visible={teamPendingDeletion !== null}
        teamName={teamPendingDeletion?.team_name ?? ''}
        deleting={deleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDeleteTeam}
        onCancel={handleCancelDeleteTeam}
      />

      <TeamsFormatFilterModal
        visible={formatFilterOpen}
        selectedFormatId={formatId}
        onSelect={handleSelectFormatFilter}
        onDismiss={() => setFormatFilterOpen(false)}
      />
    </View>
  );
}