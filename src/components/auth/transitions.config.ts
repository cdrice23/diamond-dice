import type { FieldKey } from './steps.config';

export type TimingRole = 'leadOut' | 'synced' | 'leadIn';

export const TRANSITIONS: Record<string, Partial<Record<FieldKey, TimingRole>>> = {
  'initial->loginForm': { secondaryAction: 'leadOut' },
  'loginForm->initial': { forgotPassword: 'leadOut', back: 'leadOut', secondaryAction: 'leadIn' },
  'initial->signUpForm': { primaryAction: 'leadOut' },
  'signUpForm->initial': { back: 'leadOut', primaryAction: 'leadIn' },
  'loginForm->forgotPasswordForm': { password: 'leadOut', primaryAction: 'leadOut', forgotPassword: 'leadOut' },
  'forgotPasswordForm->loginForm': { back: 'leadOut', password: 'leadIn', primaryAction: 'leadIn', forgotPassword: 'leadIn' },
  'forgotPasswordForm->codeEntryForm': { email: 'leadOut', resetAction: 'leadOut' },
  'codeEntryForm->forgotPasswordForm': { back: 'leadOut', email: 'leadIn', resetAction: 'leadIn' },
  'codeEntryForm->resetPasswordForm': { resetCode: 'leadOut', resendCode: 'leadOut', back: 'leadOut' },
};

export function getTimingRole(from: string, to: string, field: FieldKey): TimingRole {
  return TRANSITIONS[`${from}->${to}`]?.[field] ?? 'synced';
}