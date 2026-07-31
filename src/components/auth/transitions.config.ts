import type { FieldKey } from './steps.config';

export type TimingRole = 'leadOut' | 'synced' | 'leadIn';

export const TRANSITIONS: Record<string, Partial<Record<FieldKey, TimingRole>>> = {
  'initial->loginForm': {
    secondaryAction: 'leadOut',
  },
  'loginForm->initial': {
    forgotPassword: 'leadOut',
    back: 'leadOut',
    secondaryAction: 'leadIn',
  },
};

export function getTimingRole(from: string, to: string, field: FieldKey): TimingRole {
  return TRANSITIONS[`${from}->${to}`]?.[field] ?? 'synced';
}