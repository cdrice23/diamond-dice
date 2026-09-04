import { useMemo, useState } from 'react';
import { CASCADE_STAGGER, FADE_TRANSITION_DURATION, LEAD_DURATION, SLOT_TRANSITION_DURATION } from '../auth.constants';
import type { FieldKey, StepDefinition } from '../steps.config';
import { getTimingRole } from '../transitions.config';

type EffectiveSlotState = { position: number; visible: boolean; moveDelay: number; fadeDelay: number; fadeDuration: number };
export type EffectiveStepDefinition = Record<FieldKey, EffectiveSlotState>;

export function useStepTransition(fromStep: string, toStep: string, targetSlots: StepDefinition): EffectiveStepDefinition {
  const [trackedTargetSlots, setTrackedTargetSlots] = useState(targetSlots);
  const [prevSlots, setPrevSlots] = useState(targetSlots);

  if (targetSlots !== trackedTargetSlots) {
    setPrevSlots(trackedTargetSlots);
    setTrackedTargetSlots(targetSlots);
  }

  return useMemo(() => {
    const keys = Object.keys(targetSlots) as FieldKey[];

    const hasLeadOut = keys.some(
      (k) => prevSlots[k].visible && !targetSlots[k].visible && getTimingRole(fromStep, toStep, k) === 'leadOut',
    );
    const syncedStart = hasLeadOut ? LEAD_DURATION : 0;

    const cascadeInKeys = keys
      .filter((k) => !prevSlots[k].visible && targetSlots[k].visible && getTimingRole(fromStep, toStep, k) === 'synced')
      .sort((a, b) => targetSlots[a].position - targetSlots[b].position);

    const cascadeOutKeys = keys
      .filter((k) => prevSlots[k].visible && !targetSlots[k].visible && getTimingRole(fromStep, toStep, k) === 'synced')
      .sort((a, b) => prevSlots[a].position - prevSlots[b].position);

    const result = {} as EffectiveStepDefinition;

    keys.forEach((key) => {
      const role = getTimingRole(fromStep, toStep, key);
      const wasVisible = prevSlots[key].visible;
      const willBeVisible = targetSlots[key].visible;

      let moveDelay = 0;
      let fadeDelay = 0;
      let fadeDuration = FADE_TRANSITION_DURATION;

      if (role === 'leadOut') {
        fadeDuration = LEAD_DURATION;
      } else if (role === 'leadIn') {
        fadeDelay = syncedStart + (SLOT_TRANSITION_DURATION * 0.3);
        fadeDuration = LEAD_DURATION;
      } else if (wasVisible && willBeVisible && prevSlots[key].position !== targetSlots[key].position) {
        moveDelay = syncedStart; 
      } else if (!wasVisible && willBeVisible) {
        const idx = cascadeInKeys.indexOf(key);
        fadeDelay = syncedStart + (idx >= 0 ? idx * CASCADE_STAGGER : 0);
        fadeDuration = SLOT_TRANSITION_DURATION;
      } else if (wasVisible && !willBeVisible) {
        const idx = cascadeOutKeys.indexOf(key);
        fadeDelay = idx >= 0 ? idx * CASCADE_STAGGER : 0;
        fadeDuration = SLOT_TRANSITION_DURATION;
      } else if (willBeVisible) {
        fadeDelay = syncedStart; 
        fadeDuration = SLOT_TRANSITION_DURATION;
      }

      result[key] = { position: targetSlots[key].position, visible: willBeVisible, moveDelay, fadeDelay, fadeDuration };
    });

    return result;
  }, [fromStep, toStep, targetSlots, prevSlots]);
}