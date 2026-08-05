import { SLOT_HEIGHT } from '@/components/auth/auth.constants';
import type { StepDefinition } from '@/components/auth/steps.config';

export function getStepContentHeight(stepDef: StepDefinition): number {
  const visiblePositions = Object.values(stepDef)
    .filter((slot) => slot.visible)
    .map((slot) => slot.position);
  const highest = visiblePositions.length > 0 ? Math.max(...visiblePositions) : 0;
  return (highest + 1) * SLOT_HEIGHT;
}