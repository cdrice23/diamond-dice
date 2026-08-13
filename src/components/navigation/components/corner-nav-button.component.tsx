import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { UseDragToExpandReturn } from '../hooks/use-drag-to-expand.hook';
import type { UseDragToPitchReturn } from '../hooks/use-drag-to-pitch.hook';

type DragHookReturn = UseDragToExpandReturn | UseDragToPitchReturn;

type CornerNavButtonProps = {
  corner: 'left' | 'right';
  size?: number;
  borderColor: string;
  fillColor: string;
  label: string;
  iconSize?: number;
  gesture: DragHookReturn['gesture'];
  animatedStyle: DragHookReturn['animatedStyle'];
  scale: DragHookReturn['scale'];
  isActive: DragHookReturn['isActive'];
  activeFillColor: string;
  fillColorOverride?: string;
  isPitching?: boolean;
  onButtonLayout?: (x: number, y: number, width: number, height: number) => void;
  iconHideScaleThreshold?: number;
  borderHideScaleThreshold?: number;
  children: (isActive: boolean) => React.ReactNode;
};

export function CornerNavButton({
  corner,
  size = 100,
  borderColor,
  fillColor,
  activeFillColor,
  fillColorOverride,
  isPitching = false,
  onButtonLayout,
  label,
  iconSize = 32,
  gesture,
  animatedStyle,
  scale,
  isActive,
  iconHideScaleThreshold = 1.15,
  borderHideScaleThreshold = 1.2,
  children,
}: CornerNavButtonProps) {
  const isLeft = corner === 'left';
  const cornerOffset = size * 0.05;
  const circleDiameter = size + cornerOffset * 0.85;
  const radius = circleDiameter / 2;

  const inwardOffset = radius * 0.05;
  const diagonalOffset = inwardOffset / Math.SQRT2;
  const iconLocalPosition = radius + diagonalOffset;

  const iconOpacityStyle = useAnimatedStyle(() => ({
    opacity: isPitching || scale.value > iconHideScaleThreshold ? 0 : 1,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: isPitching || scale.value > borderHideScaleThreshold ? 0 : 2,
  }));

  const circleRef = useRef<any>(null);
  useEffect(() => {
    if (!onButtonLayout) return;
    const timeout = setTimeout(() => {
      circleRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        onButtonLayout(x, y, width, height);
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [onButtonLayout]);

  return (
    <View style={{ position: 'absolute', bottom: 0, [isLeft ? 'left' : 'right']: 0, width: 0, height: 0 }}>
      <View
        ref={circleRef}
        style={{
          position: 'absolute',
          bottom: -cornerOffset,
          [isLeft ? 'left' : 'right']: -cornerOffset,
          width: circleDiameter,
          height: circleDiameter,
        }}
      >
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[
            {
              position: 'absolute',
              width: circleDiameter,
              height: circleDiameter,
            },
            animatedStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: circleDiameter,
                height: circleDiameter,
                borderRadius: radius,
                backgroundColor: fillColorOverride ?? (isActive ? activeFillColor : fillColor),
                borderColor,
              },
              borderStyle,
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: iconLocalPosition - iconSize / 2,
                [isLeft ? 'left' : 'right']: iconLocalPosition - iconSize / 2,
                width: iconSize,
                height: iconSize,
                alignItems: 'center',
                justifyContent: 'center',
              },
              iconOpacityStyle,
            ]}
            pointerEvents="none"
          >
            {children(isActive)}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      </View>
    </View>
  );
}