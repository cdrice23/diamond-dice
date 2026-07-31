export type FieldKey =
  | "identifier"
  | "password"
  | "primaryAction"
  | "secondaryAction"
  | "forgotPassword"
  | "back";

type SlotState = { position: number; visible: boolean };
export type StepDefinition = Record<FieldKey, SlotState>;

export const STEPS: Record<"initial" | "loginForm", StepDefinition> = {
  initial: {
    identifier: { position: 0, visible: false },
    password: { position: 1, visible: false },
    primaryAction: { position: 0, visible: true },
    secondaryAction: { position: 1, visible: true },
    forgotPassword: { position: 3, visible: false },
    back: { position: 4, visible: false },
  },
  loginForm: {
    identifier: { position: 0, visible: true },
    password: { position: 1, visible: true },
    primaryAction: { position: 2, visible: true },
    secondaryAction: { position: 1, visible: false },
    forgotPassword: { position: 3, visible: true },
    back: { position: 4, visible: true },
  },
};
