import { useReducer } from 'react';
import { TeamWizardPath, TeamWizardState, TeamWizardStep, WizardPitcherSlot, WizardPositionSlot } from '../teams.types';

const EMPTY_POSITION_SLOTS: WizardPositionSlot[] = [
  'C', '1B', '2B', 'SS', '3B', 'OF', 'OF', 'OF', 'DH',
].map((position) => ({ position, playerId: null, playerName: null, playerImageUrl: null, eligiblePositions: [], level: null }));

function initialState(): TeamWizardState {
  return {
    path: null,
    step: 'entry',
    teamName: '',
    homeFieldName: '',
    primaryColor: null,
    secondaryColor: null,
    formatId: null,
    formatName: null,
    randomFilters: { mlbTeamIds: [], debutYearFrom: null, debutYearTo: null, awardGroupLabels: [] },
    positionSlots: EMPTY_POSITION_SLOTS,
    pitcherSlots: [],
    battingOrder: [],
    validationErrors: [],
    customColorSwatches: [],
  };
}

type Action =
  | { type: 'SET_PATH'; path: TeamWizardPath }
  | { type: 'GO_TO_STEP'; step: TeamWizardStep }
  | { type: 'SET_TEAM_NAME'; value: string }
  | { type: 'SET_HOME_FIELD_NAME'; value: string }
  | { type: 'SET_PRIMARY_COLOR'; value: string }
  | { type: 'SET_SECONDARY_COLOR'; value: string }
  | { type: 'SET_FORMAT'; formatId: string; formatName: string }
  | { type: 'ASSIGN_POSITION_PLAYER'; slotIndex: number; player: Omit<WizardPositionSlot, 'position'> }
  | { type: 'REMOVE_POSITION_PLAYER'; slotIndex: number }
  | { type: 'SET_PITCHER_SLOTS'; slots: WizardPitcherSlot[] }
  | { type: 'ASSIGN_PITCHER_PLAYER'; slotIndex: number; player: WizardPitcherSlot }
  | { type: 'REMOVE_PITCHER_PLAYER'; slotIndex: number }
  | { type: 'SET_BATTING_ORDER'; order: number[] }
  | { type: 'SET_VALIDATION_ERRORS'; errors: string[] }
  | { type: 'RESET' }
  | { type: 'ADD_CUSTOM_SWATCH'; hex: string }
  | { type: 'UPDATE_CUSTOM_SWATCH'; index: number; hex: string }
  | { type: 'RESET_BASIC_INFO' }
  | { type: 'RESET' };

function reducer(state: TeamWizardState, action: Action): TeamWizardState {
  switch (action.type) {
    case 'SET_PATH':
      return { ...state, path: action.path };
    case 'GO_TO_STEP':
      return { ...state, step: action.step };
    case 'SET_TEAM_NAME':
      return { ...state, teamName: action.value };
    case 'SET_HOME_FIELD_NAME':
      return { ...state, homeFieldName: action.value };
    case 'SET_PRIMARY_COLOR':
      return { ...state, primaryColor: action.value };
    case 'SET_SECONDARY_COLOR':
      return { ...state, secondaryColor: action.value };
    case 'SET_FORMAT':
      return { ...state, formatId: action.formatId, formatName: action.formatName };
    case 'ASSIGN_POSITION_PLAYER':
      return {
        ...state,
        positionSlots: state.positionSlots.map((slot, i) =>
          i === action.slotIndex ? { ...slot, ...action.player } : slot
        ),
      };
    case 'REMOVE_POSITION_PLAYER':
      return {
        ...state,
        positionSlots: state.positionSlots.map((slot, i) =>
          i === action.slotIndex
            ? { ...slot, playerId: null, playerName: null, playerImageUrl: null, eligiblePositions: [], level: null }
            : slot
        ),
      };
    case 'SET_PITCHER_SLOTS':
      return { ...state, pitcherSlots: action.slots };
    case 'ASSIGN_PITCHER_PLAYER':
      return {
        ...state,
        pitcherSlots: state.pitcherSlots.map((slot, i) => (i === action.slotIndex ? action.player : slot)),
      };
    case 'REMOVE_PITCHER_PLAYER':
      return {
        ...state,
        pitcherSlots: state.pitcherSlots.map((slot, i) =>
          i === action.slotIndex
            ? { playerId: null, playerName: null, playerImageUrl: null, eligiblePositions: [], level: null }
            : slot
        ),
      };
    case 'SET_BATTING_ORDER':
      return { ...state, battingOrder: action.order };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.errors };
    case 'RESET_BASIC_INFO':
      return {
        ...state,
        teamName: '',
        homeFieldName: '',
        primaryColor: null,
        secondaryColor: null,
      };
    case 'RESET':
      return initialState();
    case 'ADD_CUSTOM_SWATCH':
      return { ...state, customColorSwatches: [...state.customColorSwatches, action.hex] };
    case 'UPDATE_CUSTOM_SWATCH':
      return {
        ...state,
        customColorSwatches: state.customColorSwatches.map((hex, i) => (i === action.index ? action.hex : hex)),
      };
    default:
      return state;
  }
}

export function useTeamWizard() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  return { state, dispatch };
}