import { supabase } from '@/utils/supabase';
import { useState } from 'react';

export function useDeleteTeam() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteTeam(teamId: string): Promise<boolean> {
    setDeleting(true);
    setError(null);

    const { error: invokeError } = await supabase.functions.invoke('delete-team', {
      body: { team_id: teamId },
    });

    setDeleting(false);

    if (!invokeError) return true;

    const context = (invokeError as { context?: Response }).context;
    if (context) {
      try {
        const responseBody = await context.json();
        setError(responseBody?.error?.message ?? 'Could not delete team. Please try again.');
      } catch {
        setError('Connection issue. Please try again.');
      }
    } else {
      setError('Could not delete team. Please try again.');
    }

    return false;
  }

  function clearError() {
    setError(null);
  }

  return { deleteTeam, deleting, error, clearError };
}