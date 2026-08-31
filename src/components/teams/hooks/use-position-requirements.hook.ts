import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export type PositionSlotDefinition = {
  position: string;
  requiresEligibility: boolean;
};

export function usePositionRequirements() {
  const [slots, setSlots] = useState<PositionSlotDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPositionRequirements() {
      const { data } = await supabase
        .from('position_requirements')
        .select('slot_position, requires_eligibility, min_count')
        .order('slot_position');

      if (isMounted) {
        const expanded: PositionSlotDefinition[] = (data ?? []).flatMap((row) =>
          Array.from({ length: row.min_count }, () => ({
            position: row.slot_position,
            requiresEligibility: row.requires_eligibility,
          }))
        );
        setSlots(expanded);
        setLoading(false);
      }
    }

    fetchPositionRequirements();
    return () => {
      isMounted = false;
    };
  }, []);

  return { slots, loading };
}