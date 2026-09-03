import { PlayerDatabaseMultiSelectModal } from '@/components/player-database/components/player-database-multi-select-modal.component';
import { useMlbTeams } from '@/components/player-database/hooks/use-mlb-teams.hook';
import { AWARD_GROUPS, DEBUT_YEAR_CEILING, DEBUT_YEAR_FLOOR } from '@/components/player-database/player-database.constants';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamDebutRangeModal } from '@/components/teams/components/add-team-debut-range-modal.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { TeamWizardState } from '../teams.types';
import { TeamsListCardFormatChip } from './teams-list-format-chip.component';

type AddTeamRandomFiltersStepProps = {
  formatName: string | null;
  filters: TeamWizardState['randomFilters'];
  onChangeFilters: (partial: Partial<TeamWizardState['randomFilters']>) => void;
};

const MAX_SHOWN_ITEMS = 2;

function summaryFor(ids: string[], labelMap: Map<string, string>): string | null {
  if (ids.length === 0) return null;
  const labels = ids.map((id) => labelMap.get(id) ?? id);
  if (labels.length <= MAX_SHOWN_ITEMS) return labels.join(', ');
  const shown = labels.slice(0, MAX_SHOWN_ITEMS).join(', ');
  return `${shown} +${labels.length - MAX_SHOWN_ITEMS} More`;
}

type AddFilterButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | null;
  onPress: () => void;
};

function AddFilterButton({ icon, label, value, onPress }: AddFilterButtonProps) {
  const { colors } = useTheme();
  const isSet = value !== null;

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-2 active:opacity-60">
      <MaterialCommunityIcons name={isSet ? icon : 'plus'} size={22} color={isSet ? colors.primary : colors.mutedForeground} />
      <Text
        style={{ color: isSet ? colors.primary : colors.mutedForeground }}
        className="flex-1 text-lg font-semibold"
        numberOfLines={2}
      >
        {isSet ? `${label}: ${value}` : `Add ${label} Filter`}
      </Text>
    </Pressable>
  );
}

type FilterRowDescriptor = {
  key: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | null;
  onPress: () => void;
};

export function AddTeamRandomFiltersStep({ formatName, filters, onChangeFilters }: AddTeamRandomFiltersStepProps) {
  const { colors } = useTheme();
  const { options: teamOptions } = useMlbTeams();
  const [activeSubModal, setActiveSubModal] = useState<'teams' | 'awards' | 'dates' | null>(null);

  const awardOptions = useMemo(() => AWARD_GROUPS.map((group) => ({ id: group.label, label: group.label })), []);
  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = DEBUT_YEAR_FLOOR; year <= DEBUT_YEAR_CEILING; year++) list.push(year);
    return list;
  }, []);

  const teamLabelById = useMemo(() => new Map(teamOptions.map((o) => [o.id, o.label])), [teamOptions]);
  const awardLabelById = useMemo(() => new Map(awardOptions.map((o) => [o.id, o.label])), [awardOptions]);

  const dateRangeSummary =
    filters.debutYearFrom !== null || filters.debutYearTo !== null
      ? `${filters.debutYearFrom ?? DEBUT_YEAR_FLOOR}–${filters.debutYearTo ?? DEBUT_YEAR_CEILING}`
      : null;

  const anyFilterActive =
    filters.mlbTeamIds.length > 0 ||
    filters.awardGroupLabels.length > 0 ||
    filters.debutYearFrom !== null ||
    filters.debutYearTo !== null;

  const rows: FilterRowDescriptor[] = [
    {
      key: 'teams',
      icon: 'baseball-outline',
      label: 'MLB Team',
      value: summaryFor(filters.mlbTeamIds, teamLabelById),
      onPress: () => setActiveSubModal('teams'),
    },
    {
      key: 'dates',
      icon: 'calendar-month-outline',
      label: 'Debut Date Range',
      value: dateRangeSummary,
      onPress: () => setActiveSubModal('dates'),
    },
    {
      key: 'awards',
      icon: 'trophy',
      label: 'Awards',
      value: summaryFor(filters.awardGroupLabels, awardLabelById),
      onPress: () => setActiveSubModal('awards'),
    },
  ];

  function handleClearAll() {
    onChangeFilters({ mlbTeamIds: [], awardGroupLabels: [], debutYearFrom: null, debutYearTo: null });
  }

  return (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 8, gap: 40, paddingBottom: 24 }}>
      <View className="gap-1">
        <CardSectionHeader label="Selected Format" />
        {formatName && (
          <View className="self-start">
            <TeamsListCardFormatChip formatName={formatName} size="lg" />
          </View>
        )}
      </View>

      <View>
        <CardSectionHeader label="Optional Filters" />

        <View>
          {rows.map((row) => (
            <AddFilterButton key={row.key} icon={row.icon} label={row.label} value={row.value} onPress={row.onPress} />
          ))}
        </View>

        {anyFilterActive && (
          <Pressable
            onPress={handleClearAll}
            className="mt-3 self-center rounded-md px-4 py-2"
            style={{ backgroundColor: adjustHslAlpha(colors.destructive, 0.12), borderWidth: 1, borderColor: adjustHslAlpha(colors.destructive, 0.45) }}
          >
            <Text style={{ color: colors.destructive }} className="text-base font-semibold">
              Clear All Filters
            </Text>
          </Pressable>
        )}
      </View>

      <PlayerDatabaseMultiSelectModal
        visible={activeSubModal === 'teams'}
        title="MLB Teams"
        options={teamOptions}
        selectedIds={filters.mlbTeamIds}
        onApply={(mlbTeamIds) => onChangeFilters({ mlbTeamIds })}
        onDismiss={() => setActiveSubModal(null)}
        searchPlaceholder="Search teams..."
      />

      <PlayerDatabaseMultiSelectModal
        visible={activeSubModal === 'awards'}
        title="Awards"
        options={awardOptions}
        selectedIds={filters.awardGroupLabels}
        onApply={(awardGroupLabels) => onChangeFilters({ awardGroupLabels })}
        onDismiss={() => setActiveSubModal(null)}
        searchPlaceholder="Search awards..."
      />

      <AddTeamDebutRangeModal
        visible={activeSubModal === 'dates'}
        years={years}
        initialFrom={filters.debutYearFrom}
        initialTo={filters.debutYearTo}
        yearFloor={DEBUT_YEAR_FLOOR}
        yearCeiling={DEBUT_YEAR_CEILING}
        onApply={(from, to) => onChangeFilters({ debutYearFrom: from, debutYearTo: to })}
        onDismiss={() => setActiveSubModal(null)}
      />
    </ScrollView>
  );
}