export type FieldKey =
  | 'email'
  | 'username'
  | 'password'
  | 'confirmPassword'
  | 'primaryAction'
  | 'secondaryAction'
  | 'forgotPassword'
  | 'back';

type SlotState = { position: number; visible: boolean };
export type FormStep = 'initial' | 'loginForm' | 'signUpForm';
export type StepDefinition = Record<FieldKey, SlotState>;

export const STEPS: Record<FormStep, StepDefinition> = {
  initial: {
    email: { position: 0, visible: false },
    username: { position: 0, visible: false },
    password: { position: 1, visible: false },
    confirmPassword: { position: 3, visible: false },
    primaryAction: { position: 0, visible: true },
    secondaryAction: { position: 1, visible: true },
    forgotPassword: { position: 3, visible: false },
    back: { position: 4, visible: false },
  },
  loginForm: {
    email: { position: 0, visible: true },
    username: { position: 0, visible: false },
    password: { position: 1, visible: true },
    confirmPassword: { position: 3, visible: false },
    primaryAction: { position: 2, visible: true },
    secondaryAction: { position: 1, visible: false },
    forgotPassword: { position: 3, visible: true },
    back: { position: 4, visible: true },
  },
  signUpForm: {
    email: { position: 0, visible: true },
    username: { position: 1, visible: true },
    password: { position: 2, visible: true },
    confirmPassword: { position: 3, visible: true },
    primaryAction: { position: 4, visible: true },
    secondaryAction: { position: 4, visible: false },
    forgotPassword: { position: 3, visible: false },
    back: { position: 5, visible: true },
  },
};