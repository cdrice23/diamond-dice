import { useAwardGroupLookup } from '@/components/player-database/hooks/use-award-group-lookup.hook';
import { AddTeamBasicInfoStep } from '@/components/teams/components/add-team-basic-info-step.component';
import { AddTeamBattingOrderStep } from '@/components/teams/components/add-team-batting-order-step.component';
import { AddTeamEntryStep } from '@/components/teams/components/add-team-entry-step.component';
import { AddTeamFormatStep } from '@/components/teams/components/add-team-format-step.component';
import { AddTeamRandomFiltersStep } from '@/components/teams/components/add-team-random-filters-step.component';
import { AddTeamRandomReviewStep, RegenerateHeaderButton } from '@/components/teams/components/add-team-random-review-step.component';
import { AddTeamReviewStep } from '@/components/teams/components/add-team-review-step.component';
import { AddTeamRosterSlotsStep } from '@/components/teams/components/add-team-roster-slots-step.component';
import { AddTeamWizard } from '@/components/teams/components/add-team-wizard.component';
import { useFormatRosterRequirements } from '@/components/teams/hooks/use-format-roster-requirements.hook';
import { useGenerateTeamRosterDraft } from '@/components/teams/hooks/use-generate-team-roster-draft.hook';
import { useSaveTeam } from '@/components/teams/hooks/use-save-team.hook';
import { useTeamWizard } from '@/components/teams/hooks/use-team-wizard.hook';
import { useValidateTeamBasicInfo } from '@/components/teams/hooks/use-validate-team-basic-info.hook';
import { useValidateTeamRosterDraft } from '@/components/teams/hooks/use-validate-team-roster-draft.hook';
import type { TeamWizardState } from '@/components/teams/teams.types';
import { computePitcherSlotRange } from '@/components/teams/utils/roster-level-counts';
import { useToast } from '@/utils/toast-provider';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const REGENERATE_WARNING_THRESHOLD = 3;

function isBasicInfoValid(state: TeamWizardState): boolean {
  return (
    state.teamName.trim().length > 0 &&
    state.homeFieldName.trim().length > 0 &&
    state.primaryColor !== null &&
    state.secondaryColor !== null &&
    state.primaryColor.toLowerCase() !== state.secondaryColor.toLowerCase()
  );
}

function isSlotsValid(state: TeamWizardState, pitcherMin: number): boolean {
  const allPositionFilled = state.positionSlots.every((slot) => slot.playerId !== null);
  const filledPitcherCount = state.pitcherSlots.filter((slot) => slot.playerId !== null).length;
  return allPositionFilled && filledPitcherCount >= pitcherMin;
}

export default function AddTeamScreen() {
  const router = useRouter();
  const { state, dispatch } = useTeamWizard();
  const { showToast } = useToast();
  const { validateBasicInfo, errors: basicInfoErrors, checking: checkingBasicInfo } = useValidateTeamBasicInfo();
  const {
    validateRosterDraft,
    errors: rosterErrors,
    checking: checkingRoster,
    clearErrors: clearRosterErrors,
  } = useValidateTeamRosterDraft();
  const { requirements } = useFormatRosterRequirements(state.formatId);
  const pitcherRange = computePitcherSlotRange(requirements);
  const { saveTeam, saving, error: saveError } = useSaveTeam();
  const { generateRosterDraft, generating, error: generateError } = useGenerateTeamRosterDraft();
  const { expandLabels } = useAwardGroupLookup();
  const [regenerateCount, setRegenerateCount] = useState(0);

  function handleChoosePath(path: 'scratch' | 'random') {
    dispatch({ type: 'SET_PATH', path });
    dispatch({ type: 'GO_TO_STEP', step: 'basicInfo' });
  }

  async function handleBasicInfoConfirm() {
    const isValid = await validateBasicInfo(state.teamName, state.homeFieldName);
    if (isValid) {
      dispatch({ type: 'GO_TO_STEP', step: 'format' });
    }
  }

  function handleSelectFormat(formatId: string, formatName: string, pitcherCount: number) {
    dispatch({ type: 'SET_FORMAT', formatId, formatName });
    dispatch({ type: 'SET_PITCHER_SLOT_COUNT', count: pitcherCount });
    clearRosterErrors();
  }

  function handleClearAllPositionPlayers() {
    dispatch({ type: 'CLEAR_ALL_POSITION_PLAYERS' });
    clearRosterErrors();
  }

  function handleClearAllPitchers(baseCount: number) {
    dispatch({ type: 'RESET_PITCHER_SLOTS', count: baseCount });
    clearRosterErrors();
  }

  async function handleRosterConfirm() {
    if (!state.formatId) return;
    const isValid = await validateRosterDraft(state.formatId, state.positionSlots, state.pitcherSlots);
    if (isValid) {
      dispatch({ type: 'GO_TO_STEP', step: 'battingOrder' });
    }
  }

  async function runGeneration(): Promise<boolean> {
    if (!state.formatId) return false;

    const roster = await generateRosterDraft(state.formatId, {
      mlbTeamIds: state.randomFilters.mlbTeamIds,
      debutYearFrom: state.randomFilters.debutYearFrom,
      debutYearTo: state.randomFilters.debutYearTo,
      awardTypeIds: expandLabels(state.randomFilters.awardGroupLabels),
    });

    if (roster) {
      dispatch({ type: 'SET_GENERATED_ROSTER', positionSlots: roster.positionSlots, pitcherSlots: roster.pitcherSlots });
      return true;
    }

    if (generateError) {
      showToast(generateError, 'error');
    }
    return false;
  }

  async function handleGenerateAndContinue() {
    const ok = await runGeneration();
    if (ok) {
      setRegenerateCount(0);
      dispatch({ type: 'GO_TO_STEP', step: 'randomReview' });
    }
  }

  async function handleRegenerate() {
    const ok = await runGeneration();
    if (ok) {
      setRegenerateCount((prev) => prev + 1);
    }
  }

  async function handleSaveTeam() {
    if (!state.formatId || !state.primaryColor || !state.secondaryColor) return;

    const teamId = await saveTeam({
      teamName: state.teamName,
      homeFieldName: state.homeFieldName,
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      formatId: state.formatId,
      positionSlots: state.positionSlots,
      pitcherSlots: state.pitcherSlots,
      battingOrder: state.battingOrder,
    });

    if (teamId) {
      dispatch({ type: 'RESET' });
      router.replace('/teams');
    } else if (saveError) {
      showToast(saveError.message, 'error');
    }
  }

  if (state.step === 'entry') {
    return (
      <AddTeamWizard onCancel={() => router.replace('/teams')} onBack={null} onConfirm={null} showBottomBar={false}>
        <AddTeamEntryStep onChoosePath={handleChoosePath} onCancel={() => router.replace('/teams')} />
      </AddTeamWizard>
    );
  }

  if (state.step === 'basicInfo') {
    return (
      <AddTeamWizard
        onCancel={() => router.replace('/teams')}
        onBack={() => {
          dispatch({ type: 'RESET_BASIC_INFO' });
          dispatch({ type: 'GO_TO_STEP', step: 'entry' });
        }}
        onConfirm={handleBasicInfoConfirm}
        confirmDisabled={!isBasicInfoValid(state) || checkingBasicInfo}
        confirmLabel={checkingBasicInfo ? 'Checking...' : 'Confirm'}
      >
        <AddTeamBasicInfoStep
          teamName={state.teamName}
          homeFieldName={state.homeFieldName}
          primaryColor={state.primaryColor}
          secondaryColor={state.secondaryColor}
          customColorSwatches={state.customColorSwatches}
          fieldErrors={basicInfoErrors}
          onTeamNameChange={(value) => dispatch({ type: 'SET_TEAM_NAME', value })}
          onHomeFieldNameChange={(value) => dispatch({ type: 'SET_HOME_FIELD_NAME', value })}
          onPrimaryColorChange={(value) => dispatch({ type: 'SET_PRIMARY_COLOR', value })}
          onSecondaryColorChange={(value) => dispatch({ type: 'SET_SECONDARY_COLOR', value })}
          onAddCustomSwatch={(hex) => dispatch({ type: 'ADD_CUSTOM_SWATCH', hex })}
          onUpdateCustomSwatch={(index, hex) => dispatch({ type: 'UPDATE_CUSTOM_SWATCH', index, hex })}
        />
      </AddTeamWizard>
    );
  }

  if (state.step === 'format') {
    return (
      <AddTeamWizard
        subtitle="Choose a Format"
        helperText="Formats determine what level of gameplay you want to play with this team"
        onCancel={() => router.replace('/teams')}
        onBack={() => {
          dispatch({ type: 'RESET_FORMAT' });
          dispatch({ type: 'GO_TO_STEP', step: 'basicInfo' });
        }}
        onConfirm={() => dispatch({ type: 'GO_TO_STEP', step: state.path === 'random' ? 'randomFilters' : 'slots' })}
        confirmDisabled={!state.formatId}
      >
        <AddTeamFormatStep formatId={state.formatId} formatName={state.formatName} onSelectFormat={handleSelectFormat} />
      </AddTeamWizard>
    );
  }

  if (state.step === 'randomFilters') {
    return (
      <AddTeamWizard
        subtitle="Generate a Roster"
        onCancel={() => router.replace('/teams')}
        onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'format' })}
        onConfirm={handleGenerateAndContinue}
        confirmDisabled={generating}
        confirmLabel={generating ? 'Generating...' : 'Generate My Team'}
      >
        <AddTeamRandomFiltersStep
          formatName={state.formatName}
          filters={state.randomFilters}
          onChangeFilters={(partial) => dispatch({ type: 'SET_RANDOM_FILTERS', filters: partial })}
        />
      </AddTeamWizard>
    );
  }

  if (state.step === 'randomReview') {
    return (
      <AddTeamWizard
        subtitle="Review Generated Roster"
        headerAction={<RegenerateHeaderButton regenerating={generating} onPress={handleRegenerate} />}
        onCancel={() => router.replace('/teams')}
        onBack={() => {
          setRegenerateCount(0);
          dispatch({ type: 'GO_TO_STEP', step: 'randomFilters' });
        }}
        onConfirm={() => dispatch({ type: 'GO_TO_STEP', step: 'slots' })}
        confirmLabel="Continue"
      >
        <AddTeamRandomReviewStep
          formatName={state.formatName}
          positionSlots={state.positionSlots}
          pitcherSlots={state.pitcherSlots}
          loading={generating}
          showSpamWarning={regenerateCount >= REGENERATE_WARNING_THRESHOLD}
        />
      </AddTeamWizard>
    );
  }

  if (state.step === 'slots') {
    return (
      <AddTeamWizard
        subtitle="Add Players to Roster"
        onCancel={() => router.replace('/teams')}
        onBack={() => dispatch({ type: 'GO_TO_STEP', step: state.path === 'random' ? 'randomReview' : 'format' })}
        onConfirm={handleRosterConfirm}
        confirmDisabled={!isSlotsValid(state, pitcherRange.min) || checkingRoster}
        confirmLabel={checkingRoster ? 'Checking...' : 'Confirm'}
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
          onClearAllPositionPlayers={handleClearAllPositionPlayers}
          onClearAllPitchers={handleClearAllPitchers}
        />
      </AddTeamWizard>
    );
  }

  if (state.step === 'battingOrder') {
    return (
      <AddTeamWizard
        subtitle="Set Batting Order"
        onCancel={() => router.replace('/teams')}
        onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'slots' })}
        onConfirm={() => dispatch({ type: 'GO_TO_STEP', step: 'review' })}
      >
        <AddTeamBattingOrderStep
          positionSlots={state.positionSlots}
          battingOrder={state.battingOrder}
          onChangeBattingOrder={(order) => dispatch({ type: 'SET_BATTING_ORDER', order })}
        />
      </AddTeamWizard>
    );
  }

  if (state.step === 'review') {
    return (
      <AddTeamWizard
        hideDefaultHeader
        onCancel={() => router.replace('/teams')}
        onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'battingOrder' })}
        onConfirm={handleSaveTeam}
        confirmDisabled={saving}
        confirmLabel={saving ? 'Saving...' : 'Save New Team'}
      >
        <AddTeamReviewStep
          teamName={state.teamName}
          homeFieldName={state.homeFieldName}
          formatName={state.formatName}
          primaryColor={state.primaryColor}
          secondaryColor={state.secondaryColor}
          positionSlots={state.positionSlots}
          pitcherSlots={state.pitcherSlots}
          battingOrder={state.battingOrder}
        />
      </AddTeamWizard>
    );
  }

  return (
    <AddTeamWizard onCancel={() => router.replace('/teams')} onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'basicInfo' })} onConfirm={null}>
      <></>
    </AddTeamWizard>
  );
}