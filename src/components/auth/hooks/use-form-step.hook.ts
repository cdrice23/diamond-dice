import { useRef } from 'react';
import type { FormStep } from '../steps.config';

export function useFormStep(step: FormStep | 'checkEmail'): FormStep {
  const lastFormStepRef = useRef<FormStep>('initial');
  const formStep: FormStep = step === 'checkEmail' ? lastFormStepRef.current : step;
  lastFormStepRef.current = formStep;
  return formStep;
}