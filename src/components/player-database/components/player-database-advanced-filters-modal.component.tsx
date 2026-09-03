import { PlayerDatabaseYearWheelModal } from '@/components/player-database/components/player-database-year-wheel-modal.component';
import { useMlbTeams } from '@/components/player-database/hooks/use-mlb-teams.hook';
import { AWARD_GROUPS, DEBUT_YEAR_CEILING, DEBUT_YEAR_FLOOR } from '@/components/player-database/player-database.constants';
import type { PlayerDatabaseFilters } from '@/components/player-database/player-database.types';
import { BottomSheetModal } from '@/components/primitives/bottom-sheet-modal.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { PlayerDatabaseMultiSelectModal } from './player-database-multi-select-modal.component';

type AdvancedFiltersDraft = {
  teamIds: string[];
  awardGroupLabels: string[];
  debutYearFrom: number | null;
  debutYearTo: number | null;
};

type PlayerDatabaseAdvancedFiltersModalProps = {
  visible: boolean;
  onDismiss: () => void;
  filters: PlayerDatabaseFilters;
  onApply: (next: Pick<PlayerDatabaseFilters, 'teamIds' | 'awardGroupLabels' | 'debutYearFrom' | 'debutYearTo'>) => void;
};

function draftFromFilters(filters: PlayerDatabaseFilters): AdvancedFiltersDraft {
  return {
    teamIds: filters.teamIds,
    awardGroupLabels: filters.awardGroupLabels,
    debutYearFrom: filters.debutYearFrom,
    debutYearTo: filters.debutYearTo,
  };
}

function arraysHaveSameMembers(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((item) => setB.has(item));
}

function draftEqualsCommitted(draft: AdvancedFiltersDraft, filters: PlayerDatabaseFilters): boolean {
  return (
    arraysHaveSameMembers(draft.teamIds, filters.teamIds) &&
    arraysHaveSameMembers(draft.awardGroupLabels, filters.awardGroupLabels) &&
    draft.debutYearFrom === filters.debutYearFrom &&
    draft.debutYearTo === filters.debutYearTo
  );
}

function summaryFor(ids: string[], labelMap: Map<string, string>, emptyLabel: string): string {
  if (ids.length === 0) return emptyLabel;
  return ids.map((id) => labelMap.get(id) ?? id).join(', ');
}

export function PlayerDatabaseAdvancedFiltersModal({
  visible,
  onDismiss,
  filters,
  onApply,
}: PlayerDatabaseAdvancedFiltersModalProps) {
  const { colors } = useTheme();
  const { options: teamOptions } = useMlbTeams();
  const [draft, setDraft] = useState<AdvancedFiltersDraft>(() => draftFromFilters(filters));
  const [activeSubModal, setActiveSubModal] = useState<'teams' | 'awards' | null>(null);
  const [activeYearField, setActiveYearField] = useState<'from' | 'to' | null>(null);
  const wasVisibleRef = useRef(visible);

  if (visible && !wasVisibleRef.current) {
    setDraft(draftFromFilters(filters));
  }
  wasVisibleRef.current = visible;

  const awardOptions = useMemo(
    () => AWARD_GROUPS.map((group) => ({ id: group.label, label: group.label })),
    []
  );

  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = DEBUT_YEAR_FLOOR; year <= DEBUT_YEAR_CEILING; year++) {
      list.push(year);
    }
    return list;
  }, []);

  const teamLabelById = useMemo(() => new Map(teamOptions.map((o) => [o.id, o.label])), [teamOptions]);
  const awardLabelById = useMemo(() => new Map(awardOptions.map((o) => [o.id, o.label])), [awardOptions]);

  function handleApply() {
    if (!draftEqualsCommitted(draft, filters)) {
      onApply({
        teamIds: draft.teamIds,
        awardGroupLabels: draft.awardGroupLabels,
        debutYearFrom: draft.debutYearFrom,
        debutYearTo: draft.debutYearTo,
      });
    }
    onDismiss();
  }

  function handleClearAll() {
    setDraft({ teamIds: [], awardGroupLabels: [], debutYearFrom: null, debutYearTo: null });
  }

  function handleApplyFromYear(year: number | null) {
    if (year === null) {
      setDraft((prev) => ({ ...prev, debutYearFrom: null }));
      return;
    }
    setDraft((prev) => {
      if (prev.debutYearTo !== null && year > prev.debutYearTo) {
        return { ...prev, debutYearFrom: prev.debutYearTo, debutYearTo: year };
      }
      return { ...prev, debutYearFrom: year };
    });
  }

  function handleApplyToYear(year: number | null) {
    if (year === null) {
      setDraft((prev) => ({ ...prev, debutYearTo: null }));
      return;
    }
    setDraft((prev) => {
      if (prev.debutYearFrom !== null && year < prev.debutYearFrom) {
        return { ...prev, debutYearTo: prev.debutYearFrom, debutYearFrom: year };
      }
      return { ...prev, debutYearTo: year };
    });
  }

  return (
    <BottomSheetModal visible={visible} onDismiss={onDismiss} contentStyle={{ maxHeight: '85%' }}>
      <Pressable className="bg-background rounded-t-2xl p-4 pb-10" onPress={(e) => e.stopPropagation()}>
        <Text className="text-foreground mb-4 text-lg font-bold">Advanced Filters</Text>

        <View className="gap-6">
          <View>
            <Text className="text-foreground mb-2 text-base font-semibold">MLB Teams</Text>
            <Pressable
              onPress={() => setActiveSubModal('teams')}
              className="border-border flex-row items-center justify-between rounded-sm border px-3 py-2.5 active:opacity-60"
            >
              <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
                {summaryFor(draft.teamIds, teamLabelById, 'Any team')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View>
            <Text className="text-foreground mb-2 text-base font-semibold">Debut Year</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setActiveYearField('from')}
                className="border-border flex-1 flex-row items-center justify-between rounded-sm border px-3 py-2.5 active:opacity-60"
              >
                <Text className="text-foreground text-sm">From: {draft.debutYearFrom ?? '—'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => setActiveYearField('to')}
                className="border-border flex-1 flex-row items-center justify-between rounded-sm border px-3 py-2.5 active:opacity-60"
              >
                <Text className="text-foreground text-sm">To: {draft.debutYearTo ?? '—'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <View>
            <Text className="text-foreground mb-2 text-base font-semibold">Awards</Text>
            <Pressable
              onPress={() => setActiveSubModal('awards')}
              className="border-border flex-row items-center justify-between rounded-sm border px-3 py-2.5 active:opacity-60"
            >
              <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
                {summaryFor(draft.awardGroupLabels, awardLabelById, 'Any award')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleClearAll}
          className="mt-4 items-center rounded-sm py-2.5 active:opacity-60"
          style={{ backgroundColor: colors.muted }}
        >
          <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
            Clear Advanced Filters
          </Text>
        </Pressable>

        <Pressable
          onPress={handleApply}
          className="mt-2 items-center rounded-sm py-3 active:opacity-70"
          style={{ backgroundColor: colors.level2 }}
        >
          <Text className="text-base font-semibold" style={{ color: '#F7F7F7' }}>
            Apply
          </Text>
        </Pressable>
      </Pressable>

      <PlayerDatabaseMultiSelectModal
        visible={activeSubModal === 'teams'}
        title="MLB Teams"
        options={teamOptions}
        selectedIds={draft.teamIds}
        onApply={(teamIds) => setDraft((prev) => ({ ...prev, teamIds }))}
        onDismiss={() => setActiveSubModal(null)}
        searchPlaceholder="Search teams..."
      />
      <PlayerDatabaseMultiSelectModal
        visible={activeSubModal === 'awards'}
        title="Awards"
        options={awardOptions}
        selectedIds={draft.awardGroupLabels}
        onApply={(awardGroupLabels) => setDraft((prev) => ({ ...prev, awardGroupLabels }))}
        onDismiss={() => setActiveSubModal(null)}
        searchPlaceholder="Search awards..."
      />
      <PlayerDatabaseYearWheelModal
        visible={activeYearField === 'from'}
        title="Debut Year — From"
        years={years}
        selectedYear={draft.debutYearFrom ?? DEBUT_YEAR_FLOOR}
        onApply={handleApplyFromYear}
        onDismiss={() => setActiveYearField(null)}
      />
      <PlayerDatabaseYearWheelModal
        visible={activeYearField === 'to'}
        title="Debut Year — To"
        years={years}
        selectedYear={draft.debutYearTo ?? DEBUT_YEAR_CEILING}
        onApply={handleApplyToYear}
        onDismiss={() => setActiveYearField(null)}
      />
    </BottomSheetModal>
  );
}