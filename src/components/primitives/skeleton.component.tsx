import { cn } from '@/utils/utils';
import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

type SkeletonProps = ViewProps & {
  className?: string;
};

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View className={cn('bg-muted rounded-sm', className)} style={[style, animatedStyle]} {...props} />;
}