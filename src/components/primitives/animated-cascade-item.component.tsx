import { useCascadingFadeIn } from '@/hooks/use-cascading-fade-in.hook';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

type AnimatedCascadeItemProps = {
  index: number;
  children: ReactNode;
  staggerDelayMs?: number;
  fadeDurationMs?: number;
  translateYStart?: number;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedCascadeItem({
  index,
  children,
  staggerDelayMs,
  fadeDurationMs,
  translateYStart,
  enabled,
  style,
}: AnimatedCascadeItemProps) {
  const fadeStyle = useCascadingFadeIn(index, { staggerDelayMs, fadeDurationMs, translateYStart, enabled });

  return <Animated.View style={style ? [fadeStyle, style] : fadeStyle}>{children}</Animated.View>;
}