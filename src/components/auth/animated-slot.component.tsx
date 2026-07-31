import { type PropsWithChildren } from 'react';
import Animated, { Easing, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { FADE_TRANSITION_DURATION, SLOT_HEIGHT, SLOT_TRANSITION_DURATION } from './auth.constants';

type AnimatedSlotProps = PropsWithChildren<{
  position: number;
  visible: boolean;
  moveDelay?: number;
  fadeDelay?: number;
  fadeDuration?: number;
}>;

export function AnimatedSlot({ position, visible, moveDelay = 0, fadeDelay = 0, fadeDuration = FADE_TRANSITION_DURATION, children }: AnimatedSlotProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withDelay(moveDelay, withTiming(position * SLOT_HEIGHT, { duration: SLOT_TRANSITION_DURATION, easing: Easing.out(Easing.cubic) })) },
    ],
    opacity: withDelay(fadeDelay, withTiming(visible ? 1 : 0, { duration: fadeDuration, easing: Easing.inOut(Easing.cubic) })),
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: SLOT_HEIGHT }, animatedStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}