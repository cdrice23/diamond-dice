import type { WizardPitcherSlot, WizardPositionSlot } from '@/components/teams/teams.types';
import { supabase } from '@/utils/supabase';
import { useState } from 'react';

export type SaveTeamError = { message: string };

export function useSaveTeam() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<SaveTeamError | null>(null);

  async function saveTeam(params: {
    teamName: string;
    homeFieldName: string;
    primaryColor: string;
    secondaryColor: string;
    formatId: string;
    positionSlots: WizardPositionSlot[];
    pitcherSlots: WizardPitcherSlot[];
    battingOrder: string[];
  }): Promise<string | null> {
    setSaving(true);
    setError(null);

    const { data: teamResult, error: teamError } = await supabase.functions.invoke('upsert-team', {
      body: {
        team_name: params.teamName,
        home_field_name: params.homeFieldName,
        team_theme_color_primary: params.primaryColor,
        team_theme_color_secondary: params.secondaryColor,
      },
    });

    if (teamError || !teamResult?.team?.id) {
      setSaving(false);
      setError({ message: 'Could not save your team. Please try again.' });
      return null;
    }

    const teamId = teamResult.team.id as string;

    const { error: rosterError } = await supabase.functions.invoke('upsert-team-roster', {
      body: {
        team_id: teamId,
        format_id: params.formatId,
        position_slots: params.positionSlots.map((slot) => ({ position: slot.position, player_id: slot.playerId })),
        pitcher_slots: params.pitcherSlots.map((slot) => ({ player_id: slot.playerId })),
        batting_order: params.battingOrder,
      },
    });

    setSaving(false);

    if (rosterError) {
      setError({ message: 'Your team was created, but the roster could not be saved. Please edit your team to try again.' });
      return teamId;
    }

    return teamId;
  }

  function clearError() {
    setError(null);
  }

  return { saveTeam, saving, error, clearError };
}