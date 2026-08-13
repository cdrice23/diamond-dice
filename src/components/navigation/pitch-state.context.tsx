import { createContext, useContext, type PropsWithChildren } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

type PitchStateContextValue = {
  pastThreshold: SharedValue<number>;
};

const PitchStateContext = createContext<PitchStateContextValue | null>(null);

export function PitchStateProvider({ pastThreshold, children }: PropsWithChildren<{ pastThreshold: SharedValue<number> }>) {
  return <PitchStateContext.Provider value={{ pastThreshold }}>{children}</PitchStateContext.Provider>;
}

export function usePitchState(): PitchStateContextValue {
  const ctx = useContext(PitchStateContext);
  const fallback = useSharedValue(0);
  if (!ctx) {
    return { pastThreshold: fallback };
  }
  return ctx;
}