import type { WizardPitcherSlot, WizardPositionSlot } from '@/components/teams/teams.types';
import { supabase } from '@/utils/supabase';
import { useState } from 'react';

export type RosterDraftErrors = { position: string[]; pitcher: string[] };

const EMPTY_ERRORS: RosterDraftErrors = { position: [], pitcher: [] };

export function useValidateTeamRosterDraft() {
  const [errors, setErrors] = useState<RosterDraftErrors>(EMPTY_ERRORS);
  const [checking, setChecking] = useState(false);

  async function validateRosterDraft(
    formatId: string,
    positionSlots: WizardPositionSlot[],
    pitcherSlots: WizardPitcherSlot[]
  ): Promise<boolean> {
    setErrors(EMPTY_ERRORS);
    setChecking(true);

    const { error } = await supabase.functions.invoke('validate-team-roster-draft', {
      body: {
        format_id: formatId,
        position_slots: positionSlots.map((slot) => ({ position: slot.position, player_id: slot.playerId })),
        pitcher_slots: pitcherSlots.map((slot) => ({ player_id: slot.playerId })),
      },
    });

    setChecking(false);

    if (!error) return true;

    const context = (error as { context?: Response }).context;
    if (context) {
      const body = await context.json();
      setErrors({ position: body?.errors?.position ?? [], pitcher: body?.errors?.pitcher ?? [] });
    } else {
      setErrors({ position: ['Something went wrong. Please try again.'], pitcher: [] });
    }

    return false;
  }

  function clearErrors() {
    setErrors(EMPTY_ERRORS);
  }

  return { validateRosterDraft, errors, checking, clearErrors };
}