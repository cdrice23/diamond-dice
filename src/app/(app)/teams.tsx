import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { TeamsEmptyState } from '@/components/teams/components/teams-empty-state.component';
import { TeamsFilterBar, type TeamsSortDirection } from '@/components/teams/components/teams-filter-bar.component';
import { TeamsHeader } from '@/components/teams/components/teams-header.component';
import { TeamsListCard } from '@/components/teams/components/teams-list-card.component';
import { TeamsSearchInput } from '@/components/teams/components/teams-search-input.component';
import { useTeamsList } from '@/components/teams/hooks/use-teams-list.hook';
import type { TeamSummary } from '@/components/teams/teams.types';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const NAV_CLEARANCE_EXTRA = 16;

export default function TeamsScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const { teams: fetchedTeams, loading } = useTeamsList();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<TeamsSortDirection>('desc');
  const [formatFilterOpen, setFormatFilterOpen] = useState(false);

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

  function handleDeleteTeam(team: TeamSummary) {
    // Delete confirmation modal wiring comes later (Phase 5 per the Epic 7 UI plan).
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
          onFormatFilterPress={() => setFormatFilterOpen(true)}
        />
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          {loading ? (
            <Text className="text-muted-foreground px-4 pt-8 text-center">Loading teams...</Text>
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
                    onDeletePress={() => handleDeleteTeam(item)}
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
    </View>
  );
}