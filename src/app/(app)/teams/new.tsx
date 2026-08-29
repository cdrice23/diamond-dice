import { AddTeamBasicInfoStep } from '@/components/teams/components/add-team-basic-info-step.component';
import { AddTeamEntryStep } from '@/components/teams/components/add-team-entry-step.component';
import { AddTeamWizard } from '@/components/teams/components/add-team-wizard.component';
import { useTeamWizard } from '@/components/teams/hooks/use-team-wizard.hook';
import type { TeamWizardState } from '@/components/teams/teams.types';
import { useRouter } from 'expo-router';

function isBasicInfoValid(state: TeamWizardState): boolean {
  return (
    state.teamName.trim().length > 0 &&
    state.homeFieldName.trim().length > 0 &&
    state.primaryColor !== null &&
    state.secondaryColor !== null &&
    state.primaryColor.toLowerCase() !== state.secondaryColor.toLowerCase()
  );
}

export default function AddTeamScreen() {
  const router = useRouter();
  const { state, dispatch } = useTeamWizard();

  function handleChoosePath(path: 'scratch' | 'random') {
    dispatch({ type: 'SET_PATH', path });
    dispatch({ type: 'GO_TO_STEP', step: path === 'scratch' ? 'basicInfo' : 'format' });
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
      onConfirm={() => dispatch({ type: 'GO_TO_STEP', step: 'format' })}
      confirmDisabled={!isBasicInfoValid(state)}
    >
      <AddTeamBasicInfoStep
        teamName={state.teamName}
        homeFieldName={state.homeFieldName}
        primaryColor={state.primaryColor}
        secondaryColor={state.secondaryColor}
        customColorSwatches={state.customColorSwatches}
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

  return (
    <AddTeamWizard onCancel={() => router.replace('/teams')} onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'basicInfo' })} onConfirm={null}>
      <></>
    </AddTeamWizard>
  );
}