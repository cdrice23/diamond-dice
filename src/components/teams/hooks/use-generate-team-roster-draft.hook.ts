import type { WizardPitcherSlot, WizardPositionSlot } from '@/components/teams/teams.types';
import { supabase } from '@/utils/supabase';
import { useState } from 'react';

export type RandomFilters = {
  mlbTeamIds: string[];
  debutYearFrom: number | null;
  debutYearTo: number | null;
  awardTypeIds: string[];
};

type HydratedRosterEntry = {
  position: string;
  player_id: string;
  player_name: string | null;
  player_image_url: string | null;
  eligible_positions: string[];
  level: number | null;
};

type GenerateDraftSuccess = { success: true; roster: HydratedRosterEntry[] };
type GenerateDraftFailure = { success: false; error: { code: string; requirement?: string; message: string } };
type GenerateDraftResponse = GenerateDraftSuccess | GenerateDraftFailure;

export type GeneratedRoster = {
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
};

const POSITION_SLOT_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'DH'];

function toWizardSlots(entries: HydratedRosterEntry[]): GeneratedRoster {
  const positionEntries = entries.filter((e) => e.position !== 'P');
  const pitcherEntries = entries.filter((e) => e.position === 'P');

  const positionSlots: WizardPositionSlot[] = POSITION_SLOT_ORDER.map((position, index) => {
    const entry = positionEntries[index];
    if (!entry) {
      return { position, playerId: null, playerName: null, playerImageUrl: null, eligiblePositions: [], level: null };
    }
    return {
      position,
      playerId: entry.player_id,
      playerName: entry.player_name,
      playerImageUrl: entry.player_image_url,
      eligiblePositions: entry.eligible_positions,
      level: entry.level,
    };
  });

  const pitcherSlots: WizardPitcherSlot[] = pitcherEntries.map((entry) => ({
    playerId: entry.player_id,
    playerName: entry.player_name,
    playerImageUrl: entry.player_image_url,
    eligiblePositions: entry.eligible_positions,
    level: entry.level,
  }));

  return { positionSlots, pitcherSlots };
}

export function useGenerateTeamRosterDraft() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateRosterDraft(formatId: string, filters: RandomFilters): Promise<GeneratedRoster | null> {
    setGenerating(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('generate-team-roster-draft', {
      body: {
        format_id: formatId,
        additional_filters: {
          mlb_team_ids: filters.mlbTeamIds.length > 0 ? filters.mlbTeamIds : undefined,
          debut_year_min: filters.debutYearFrom ?? undefined,
          debut_year_max: filters.debutYearTo ?? undefined,
          award_type_ids: filters.awardTypeIds.length > 0 ? filters.awardTypeIds : undefined,
        },
      },
    });

    setGenerating(false);

    if (invokeError) {
      console.error('useGenerateTeamRosterDraft: invoke failed:', invokeError);
      setError('Something went wrong generating a roster. Please try again.');
      return null;
    }

    const result = data as GenerateDraftResponse;

    if (!result.success) {
      console.error('useGenerateTeamRosterDraft: generation failed:', result.error);
      setError(result.error.message);
      return null;
    }

    return toWizardSlots(result.roster);
  }

  function clearError() {
    setError(null);
  }

  return { generateRosterDraft, generating, error, clearError };
}