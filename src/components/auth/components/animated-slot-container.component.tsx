import { type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SLOT_COUNT, SLOT_HEIGHT } from '../auth.constants';

export function AnimatedSlotContainer({ children }: PropsWithChildren) {
  return <View style={{ height: SLOT_COUNT * SLOT_HEIGHT, width: '100%' }}>{children}</View>;
}