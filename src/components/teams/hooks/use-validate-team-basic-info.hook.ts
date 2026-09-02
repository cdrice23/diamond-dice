import { supabase } from '@/utils/supabase';
import { useState } from 'react';

export type BasicInfoFieldErrors = { team_name?: string; home_field_name?: string };

export function useValidateTeamBasicInfo() {
  const [errors, setErrors] = useState<BasicInfoFieldErrors>({});
  const [checking, setChecking] = useState(false);

  async function validateBasicInfo(teamName: string, homeFieldName: string, teamId?: string): Promise<boolean> {
    setErrors({});
    setChecking(true);

    const { error } = await supabase.functions.invoke('validate-team-basic-info', {
      body: { team_name: teamName.trim(), home_field_name: homeFieldName.trim(), team_id: teamId },
    });

    setChecking(false);

    if (!error) return true;

    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.json();
        if (body?.errors) {
          const nextErrors: BasicInfoFieldErrors = {};
          if (body.errors.team_name) nextErrors.team_name = body.errors.team_name.message;
          if (body.errors.home_field_name) nextErrors.home_field_name = body.errors.home_field_name.message;
          setErrors(nextErrors);
        } else {
          setErrors({ team_name: body?.error?.message ?? 'Something went wrong. Please try again.' });
        }
      } catch {
        setErrors({ team_name: 'Connection issue. Please try again.' });
      }
    } else {
      setErrors({ team_name: 'Something went wrong. Please try again.' });
    }

    return false;
  }

  function clearErrors() {
    setErrors({});
  }

  return { validateBasicInfo, errors, checking, clearErrors };
}