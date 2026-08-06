import { type PropsWithChildren } from 'react';
import Animated, { Easing, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { Button } from '../../primitives/button.component';
import { Text } from '../../primitives/text.component';
import { FADE_TRANSITION_DURATION, SLOT_HEIGHT, SLOT_TRANSITION_DURATION } from '../auth.constants';

type AnimatedSlotProps = PropsWithChildren<{
  position: number;
  visible: boolean;
  moveDelay?: number;
  fadeDelay?: number;
  fadeDuration?: number;
  errorText?: string | null;
  errorAction?: { label: string; onPress: () => void } | null;
}>;

export function AnimatedSlot({ position, visible, moveDelay = 0, fadeDelay = 0, fadeDuration = FADE_TRANSITION_DURATION, errorText, errorAction, children }: AnimatedSlotProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withDelay(moveDelay, withTiming(position * SLOT_HEIGHT, { duration: SLOT_TRANSITION_DURATION, easing: Easing.out(Easing.cubic) })) },
    ],
    opacity: withDelay(fadeDelay, withTiming(visible ? 1 : 0, { duration: fadeDuration, easing: Easing.inOut(Easing.cubic) })),
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: SLOT_HEIGHT }, animatedStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
      {errorText && <Text className="text-level3 text-xs mt-1 mx-auto">{errorText}</Text>}
      {errorAction && (
        <Button variant="link" onPress={errorAction.onPress} className="mt-0.5 self-start">
          <Text className="text-xs">{errorAction.label}</Text>
        </Button>
      )}
    </Animated.View>
  );
}