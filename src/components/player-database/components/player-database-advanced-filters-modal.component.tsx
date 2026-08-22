// src/components/player-database/components/player-database-advanced-filters-modal.component.tsx
import { PlayerDatabaseYearFilterSlider } from '@/components/player-database/components/player-database-year-filter-slider.component';
import { useMlbTeams } from '@/components/player-database/hooks/use-mlb-teams.hook';
import { AWARD_GROUPS } from '@/components/player-database/player-database.constants';
import type { PlayerDatabaseFilters } from '@/components/player-database/player-database.types';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, View, type LayoutChangeEvent } from 'react-native';
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

const SCROLL_TO_FOCUS_OFFSET = 24;

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

  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsetsRef = useRef<Record<string, number>>({});

  const awardOptions = useMemo(
    () => AWARD_GROUPS.map((group) => ({ id: group.label, label: group.label })),
    []
  );

  const teamLabelById = useMemo(() => new Map(teamOptions.map((o) => [o.id, o.label])), [teamOptions]);
  const awardLabelById = useMemo(() => new Map(awardOptions.map((o) => [o.id, o.label])), [awardOptions]);

  useEffect(() => {
    if (visible) {
      setDraft(draftFromFilters(filters));
    }
  }, [visible, filters]);

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

  function handleBackdropPress() {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    onDismiss();
  }

  function handleClearAll() {
    setDraft({ teamIds: [], awardGroupLabels: [], debutYearFrom: null, debutYearTo: null });
  }

  function registerFieldOffset(key: string) {
    return (event: LayoutChangeEvent) => {
      fieldOffsetsRef.current[key] = event.nativeEvent.layout.y;
    };
  }

  function scrollFieldIntoView(key: string) {
    const y = fieldOffsetsRef.current[key];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_TO_FOCUS_OFFSET), animated: true });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={handleBackdropPress}>
        <Pressable
          className="bg-background rounded-t-2xl p-4 pb-10"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-foreground mb-4 text-lg font-bold">Advanced Filters</Text>

          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="gap-6">
              <View onLayout={registerFieldOffset('teams')}>
                <Text className="text-foreground mb-2 text-base font-semibold">MLB Teams</Text>
                <Pressable
                  onPress={() => setActiveSubModal('teams')}
                  className="border-border flex-row items-center justify-between rounded-md border px-3 py-2.5"
                >
                  <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
                    {summaryFor(draft.teamIds, teamLabelById, 'Any team')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <View onLayout={registerFieldOffset('year')}>
                <PlayerDatabaseYearFilterSlider
                  yearFrom={draft.debutYearFrom}
                  yearTo={draft.debutYearTo}
                  onChange={(debutYearFrom, debutYearTo) =>
                    setDraft((prev) => ({ ...prev, debutYearFrom, debutYearTo }))
                  }
                  onInputFocus={() => scrollFieldIntoView('year')}
                />
              </View>

              <View onLayout={registerFieldOffset('awards')}>
                <Text className="text-foreground mb-2 text-base font-semibold">Awards</Text>
                <Pressable
                  onPress={() => setActiveSubModal('awards')}
                  className="border-border flex-row items-center justify-between rounded-md border px-3 py-2.5"
                >
                  <Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
                    {summaryFor(draft.awardGroupLabels, awardLabelById, 'Any award')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <Pressable onPress={handleClearAll} className="mt-4 items-center rounded-md py-2.5" style={{ backgroundColor: colors.muted }}>
            <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
              Clear Advanced Filters
            </Text>
          </Pressable>

          <Pressable onPress={handleApply} className="mt-2 items-center rounded-md py-3" style={{ backgroundColor: colors.level2 }}>
            <Text className="font-semibold text-white">Apply</Text>
          </Pressable>
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
    </Modal>
  );
}