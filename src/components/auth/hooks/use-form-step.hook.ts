import { useState } from 'react';
import type { FormStep } from '../steps.config';

export function useFormStep(step: FormStep | 'checkEmail'): FormStep {
  const [lastFormStep, setLastFormStep] = useState<FormStep>('initial');
  const formStep: FormStep = step === 'checkEmail' ? lastFormStep : step;

  if (formStep !== lastFormStep) {
    setLastFormStep(formStep);
  }

  return formStep;
}