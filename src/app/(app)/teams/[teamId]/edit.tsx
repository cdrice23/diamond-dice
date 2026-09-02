import { AddTeamBattingOrderStep } from '@/components/teams/components/add-team-batting-order-step.component';
import { AddTeamFormatStep } from '@/components/teams/components/add-team-format-step.component';
import { AddTeamRosterSlotsStep } from '@/components/teams/components/add-team-roster-slots-step.component';
import { AddTeamWizard } from '@/components/teams/components/add-team-wizard.component';
import { EditTeamOverviewStep } from '@/components/teams/components/edit-team-overview-step.component';
import { useFormatRosterRequirements } from '@/components/teams/hooks/use-format-roster-requirements.hook';
import { useSaveTeam } from '@/components/teams/hooks/use-save-team.hook';
import { useTeamDetail } from '@/components/teams/hooks/use-team-detail.hook';
import { useTeamWizard } from '@/components/teams/hooks/use-team-wizard.hook';
import { useValidateTeamBasicInfo } from '@/components/teams/hooks/use-validate-team-basic-info.hook';
import { useValidateTeamRosterDraft } from '@/components/teams/hooks/use-validate-team-roster-draft.hook';
import type { TeamWizardState, WizardPitcherSlot, WizardPositionSlot } from '@/components/teams/teams.types';
import { computePitcherSlotRange } from '@/components/teams/utils/roster-level-counts';
import { teamDetailToWizardSlots } from '@/components/teams/utils/team-slot-map';
import { useToast } from '@/utils/toast-provider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

function isSlotsValid(state: TeamWizardState, pitcherMin: number): boolean {
  const allPositionFilled = state.positionSlots.every((slot) => slot.playerId !== null);
  const filledPitcherCount = state.pitcherSlots.filter((slot) => slot.playerId !== null).length;
  return allPositionFilled && filledPitcherCount >= pitcherMin;
}

function samePlayerIds(a: { playerId: string | null }[], b: { playerId: string | null }[]): boolean {
  return JSON.stringify(a.map((s) => s.playerId)) === JSON.stringify(b.map((s) => s.playerId));
}

type SnapshotSource = {
  teamName: string;
  homeFieldName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  formatId: string | null;
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
  battingOrder: string[];
};

type EditTeamSnapshot = {
  teamName: string;
  homeFieldName: string;
  primaryColor: string;
  secondaryColor: string;
  formatId: string;
  positionPlayerIds: string;
  pitcherPlayerIds: string;
  battingOrder: string;
};

function buildSnapshot(source: SnapshotSource): EditTeamSnapshot | null {
  if (!source.formatId || !source.primaryColor || !source.secondaryColor) return null;
  return {
    teamName: source.teamName.trim(),
    homeFieldName: source.homeFieldName.trim(),
    primaryColor: source.primaryColor,
    secondaryColor: source.secondaryColor,
    formatId: source.formatId,
    positionPlayerIds: JSON.stringify(source.positionSlots.map((s) => s.playerId)),
    pitcherPlayerIds: JSON.stringify(source.pitcherSlots.map((s) => s.playerId)),
    battingOrder: JSON.stringify(source.battingOrder),
  };
}

function isDirty(current: SnapshotSource, initial: EditTeamSnapshot | null): boolean {
  if (!initial) return false;
  const currentSnapshot = buildSnapshot(current);
  if (!currentSnapshot) return false;
  return (Object.keys(initial) as (keyof EditTeamSnapshot)[]).some((key) => initial[key] !== currentSnapshot[key]);
}

type FormatRosterSnapshot = {
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
  battingOrder: string[];
};

type PreFormatStepSnapshot = { formatId: string; formatName: string | null };
type PreSlotsSnapshot = { positionSlots: WizardPositionSlot[]; pitcherSlots: WizardPitcherSlot[] };

export default function EditTeamScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { team, loading: teamLoading } = useTeamDetail(teamId);
  const { state, dispatch } = useTeamWizard();
  const { validateBasicInfo, errors: basicInfoErrors } = useValidateTeamBasicInfo();
  const { validateRosterDraft, errors: rosterErrors, clearErrors: clearRosterErrors } = useValidateTeamRosterDraft();
  const { requirements } = useFormatRosterRequirements(state.formatId);
  const pitcherRange = computePitcherSlotRange(requirements);
  const { saveTeam, saving } = useSaveTeam();

  const [initialized, setInitialized] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<EditTeamSnapshot | null>(null);
  const [rosterErrorMessage, setRosterErrorMessage] = useState<string | null>(null);
  const [preFormatStepSnapshot, setPreFormatStepSnapshot] = useState<PreFormatStepSnapshot | null>(null);
  const [preSlotsSnapshot, setPreSlotsSnapshot] = useState<PreSlotsSnapshot | null>(null);
  const [preBattingOrderSnapshot, setPreBattingOrderSnapshot] = useState<string[] | null>(null);
  const isSavingRef = useRef(false);
  const formatCacheRef = useRef<Record<string, FormatRosterSnapshot>>({});

  useEffect(() => {
    if (team && !initialized) {
      const { positionSlots, pitcherSlots, battingOrder } = teamDetailToWizardSlots(team.position_players, team.pitchers);

      dispatch({
        type: 'INIT_EDIT_TEAM',
        teamId: team.id,
        teamName: team.team_name,
        homeFieldName: team.home_field_name,
        primaryColor: team.team_theme_color_primary,
        secondaryColor: team.team_theme_color_secondary,
        formatId: team.format_id,
        formatName: team.format_name,
        positionSlots,
        pitcherSlots,
        battingOrder,
      });

      setInitialSnapshot(
        buildSnapshot({
          teamName: team.team_name,
          homeFieldName: team.home_field_name,
          primaryColor: team.team_theme_color_primary,
          secondaryColor: team.team_theme_color_secondary,
          formatId: team.format_id,
          positionSlots,
          pitcherSlots,
          battingOrder,
        })
      );

      setInitialized(true);
    }
  }, [team, initialized, dispatch]);

  useEffect(() => {
    if (!state.formatId) return;
    formatCacheRef.current[state.formatId] = {
      positionSlots: state.positionSlots,
      pitcherSlots: state.pitcherSlots,
      battingOrder: state.battingOrder,
    };
  }, [state.formatId, state.positionSlots, state.pitcherSlots, state.battingOrder]);

  async function runRosterValidityCheck(formatId: string) {
    const isValid = await validateRosterDraft(formatId, state.positionSlots, state.pitcherSlots);
    if (!isValid) {
      const combined = [...rosterErrors.position, ...rosterErrors.pitcher];
      setRosterErrorMessage(
        combined.length > 0
          ? `This roster no longer fits the selected Format: ${combined[0]}`
          : 'This roster no longer fits the selected Format. Edit your players to continue.'
      );
    } else {
      setRosterErrorMessage(null);
    }
  }

  function applyFormatSelection(formatId: string, formatName: string, pitcherCount: number) {
    const cached = formatCacheRef.current[formatId];

    dispatch({ type: 'SET_FORMAT', formatId, formatName });

    if (cached) {
      dispatch({ type: 'SET_GENERATED_ROSTER', positionSlots: cached.positionSlots, pitcherSlots: cached.pitcherSlots });
      dispatch({ type: 'SET_BATTING_ORDER', order: cached.battingOrder });
    } else {
      dispatch({ type: 'SET_PITCHER_SLOT_COUNT', count: pitcherCount });
    }
  }

  function handleOpenChangeFormat() {
    if (!state.formatId) return;
    setPreFormatStepSnapshot({ formatId: state.formatId, formatName: state.formatName });
    dispatch({ type: 'GO_TO_STEP', step: 'format' });
  }

  function handleSelectFormat(formatId: string, formatName: string, pitcherCount: number) {
    applyFormatSelection(formatId, formatName, pitcherCount);
  }

  async function handleConfirmFormatChange() {
    if (!state.formatId) return;
    dispatch({ type: 'GO_TO_STEP', step: 'overview' });
    await runRosterValidityCheck(state.formatId);
    setPreFormatStepSnapshot(null);
  }

  function handleCancelFormatChange() {
    if (preFormatStepSnapshot) {
      applyFormatSelection(preFormatStepSnapshot.formatId, preFormatStepSnapshot.formatName ?? '', 0);
    }
    setPreFormatStepSnapshot(null);
    dispatch({ type: 'GO_TO_STEP', step: 'overview' });
  }

  function handleOpenEditPlayers() {
    setPreSlotsSnapshot({ positionSlots: state.positionSlots, pitcherSlots: state.pitcherSlots });
    dispatch({ type: 'GO_TO_STEP', step: 'slots' });
  }

  async function handleRosterSlotsConfirm() {
    if (!state.formatId) return;
    const isValid = await validateRosterDraft(state.formatId, state.positionSlots, state.pitcherSlots);
    if (isValid) {
      clearRosterErrors();
      setRosterErrorMessage(null);
      setPreSlotsSnapshot(null);
      dispatch({ type: 'GO_TO_STEP', step: 'overview' });
    }
  }

  function handleCancelEditPlayers() {
    setPreSlotsSnapshot(null);
    dispatch({ type: 'GO_TO_STEP', step: 'overview' });
  }

  function handleOpenEditBattingOrder() {
    setPreBattingOrderSnapshot(state.battingOrder);
    dispatch({ type: 'GO_TO_STEP', step: 'battingOrder' });
  }

  function handleConfirmBattingOrder() {
    setPreBattingOrderSnapshot(null);
    dispatch({ type: 'GO_TO_STEP', step: 'overview' });
  }

  const slotsUnchanged = preSlotsSnapshot
    ? samePlayerIds(preSlotsSnapshot.positionSlots, state.positionSlots) && samePlayerIds(preSlotsSnapshot.pitcherSlots, state.pitcherSlots)
    : false;

  const battingOrderUnchanged = preBattingOrderSnapshot
    ? JSON.stringify(preBattingOrderSnapshot) === JSON.stringify(state.battingOrder)
    : false;

  async function handleSave() {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      if (!state.editingTeamId || !state.formatId || !state.primaryColor || !state.secondaryColor) return;

      const isBasicInfoOk = await validateBasicInfo(state.teamName, state.homeFieldName, state.editingTeamId ?? undefined);
      if (!isBasicInfoOk) return;

      const savedTeamId = await saveTeam({
        teamId: state.editingTeamId,
        teamName: state.teamName,
        homeFieldName: state.homeFieldName,
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        formatId: state.formatId,
        positionSlots: state.positionSlots,
        pitcherSlots: state.pitcherSlots,
        battingOrder: state.battingOrder,
      });

      if (savedTeamId) {
        router.replace(`/teams/${savedTeamId}`);
      } else {
        showToast('Could not save your team. Please try again.', 'error');
      }
    } finally {
      isSavingRef.current = false;
    }
  }

  if (teamLoading || !initialized) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Loading team...</Text>
      </View>
    );
  }

  if (state.step === 'format') {
    return (
      <AddTeamWizard
        title="Edit Team"
        titleIcon="tools"
        subtitle="Choose a Format"
        actionsLayout="stacked"
        onCancel={handleCancelFormatChange}
        onBack={handleCancelFormatChange}
        onConfirm={handleConfirmFormatChange}
        confirmDisabled={!state.formatId || (!!preFormatStepSnapshot && state.formatId === preFormatStepSnapshot.formatId)}
      >
        <AddTeamFormatStep formatId={state.formatId} formatName={state.formatName} onSelectFormat={handleSelectFormat} />
      </AddTeamWizard>
    );
  }

  if (state.step === 'slots') {
    return (
      <AddTeamWizard
        title="Edit Team"
        titleIcon="tools"
        subtitle="Edit Players"
        actionsLayout="stacked"
        onCancel={handleCancelEditPlayers}
        onBack={handleCancelEditPlayers}
        onConfirm={handleRosterSlotsConfirm}
        confirmDisabled={!isSlotsValid(state, pitcherRange.min) || slotsUnchanged}
        confirmLabel="Confirm"
      >
        <AddTeamRosterSlotsStep
          formatName={state.formatName}
          requirements={requirements}
          positionSlots={state.positionSlots}
          pitcherSlots={state.pitcherSlots}
          positionErrors={rosterErrors.position}
          pitcherErrors={rosterErrors.pitcher}
          onAssignPositionPlayer={(slotIndex, player) => dispatch({ type: 'ASSIGN_POSITION_PLAYER', slotIndex, player })}
          onAssignPitcherPlayer={(slotIndex, player) => dispatch({ type: 'ASSIGN_PITCHER_PLAYER', slotIndex, player })}
          onAddPitcherSlot={() => dispatch({ type: 'ADD_PITCHER_SLOT' })}
          onRemovePitcherSlot={(slotIndex) => dispatch({ type: 'REMOVE_PITCHER_SLOT', slotIndex })}
          onClearAllPositionPlayers={() => dispatch({ type: 'CLEAR_ALL_POSITION_PLAYERS' })}
          onClearAllPitchers={(baseCount) => dispatch({ type: 'RESET_PITCHER_SLOTS', count: baseCount })}
        />
      </AddTeamWizard>
    );
  }

  if (state.step === 'battingOrder') {
    return (
      <AddTeamWizard
        title="Edit Team"
        titleIcon="tools"
        subtitle="Edit Batting Order"
        actionsLayout="stacked"
        onCancel={() => dispatch({ type: 'GO_TO_STEP', step: 'overview' })}
        onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'overview' })}
        onConfirm={handleConfirmBattingOrder}
        confirmDisabled={battingOrderUnchanged}
      >
        <AddTeamBattingOrderStep
          positionSlots={state.positionSlots}
          battingOrder={state.battingOrder}
          onChangeBattingOrder={(order) => dispatch({ type: 'SET_BATTING_ORDER', order })}
        />
      </AddTeamWizard>
    );
  }

  return (
    <AddTeamWizard
      hideDefaultHeader
      onCancel={() => router.back()}
      onBack={null}
      onConfirm={handleSave}
      confirmDisabled={saving || !!rosterErrorMessage || !isDirty(state, initialSnapshot)}
      confirmLabel={saving ? 'Saving...' : 'Save Team'}
    >
      <EditTeamOverviewStep
        state={state}
        fieldErrors={basicInfoErrors}
        rosterErrorMessage={rosterErrorMessage}
        onTeamNameChange={(value) => dispatch({ type: 'SET_TEAM_NAME', value })}
        onHomeFieldNameChange={(value) => dispatch({ type: 'SET_HOME_FIELD_NAME', value })}
        onPrimaryColorChange={(value) => dispatch({ type: 'SET_PRIMARY_COLOR', value })}
        onSecondaryColorChange={(value) => dispatch({ type: 'SET_SECONDARY_COLOR', value })}
        onAddCustomSwatch={(hex) => dispatch({ type: 'ADD_CUSTOM_SWATCH', hex })}
        onUpdateCustomSwatch={(index, hex) => dispatch({ type: 'UPDATE_CUSTOM_SWATCH', index, hex })}
        onChangeFormat={handleOpenChangeFormat}
        onEditPlayers={handleOpenEditPlayers}
        onEditBattingOrder={handleOpenEditBattingOrder}
      />
    </AddTeamWizard>
  );
}