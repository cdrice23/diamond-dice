import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { DeleteTeamConfirmationModal } from '@/components/teams/components/delete-team-confirmation-modal.component';
import { TeamsEmptyState } from '@/components/teams/components/teams-empty-state.component';
import { TeamsFilterBar, type TeamsSortDirection } from '@/components/teams/components/teams-filter-bar.component';
import { TeamsHeader } from '@/components/teams/components/teams-header.component';
import { TeamsListCard } from '@/components/teams/components/teams-list-card.component';
import { TeamsSearchInput } from '@/components/teams/components/teams-search-input.component';
import { useDeleteTeam } from '@/components/teams/hooks/use-delete-team.hook';
import { useTeamsList } from '@/components/teams/hooks/use-teams-list.hook';
import type { TeamSummary } from '@/components/teams/teams.types';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const NAV_CLEARANCE_EXTRA = 16;

export default function TeamsScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const { teams: fetchedTeams, loading, refetch } = useTeamsList();
  const { deleteTeam, deleting, error: deleteError, clearError } = useDeleteTeam();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<TeamsSortDirection>('desc');
  const [teamPendingDeletion, setTeamPendingDeletion] = useState<TeamSummary | null>(null);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  const teams = useMemo(() => {
    const filtered = searchTerm.trim()
      ? fetchedTeams.filter((t) => t.team_name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      : fetchedTeams;

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDirection === 'desc' ? -diff : diff;
    });
  }, [searchTerm, sortDirection, fetchedTeams]);

  function handleAddNewTeam() {
    router.push('/teams/new');
  }

  function handleTeamPress(team: TeamSummary) {
    router.push(`/teams/${team.id}`);
  }

  function handleEditTeam(team: TeamSummary) {
    router.push(`/teams/${team.id}/edit`);
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
        <TeamsSearchInput onSearchTermChange={setSearchTerm} />
        <TeamsFilterBar
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          formatLabel="Any Format"
          formatFilterActive={false}
          onFormatFilterPress={() => {}}
        />
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <LoadingSpinner size={80} />
            </View>
          ) : teams.length === 0 ? (
            <TeamsEmptyState />
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
    </View>
  );
}