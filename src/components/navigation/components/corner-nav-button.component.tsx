import { View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDragToExpand } from '../hooks/use-drag-to-expand.hook';

type CornerNavButtonProps = {
  corner: 'left' | 'right';
  size?: number;
  borderColor: string;
  fillColor: string;
  activeFillColor: string;
  label: string;
  onOpen: () => void;
  closeSignal: number;
  iconSize?: number;
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
  label,
  onOpen,
  closeSignal,
  iconSize = 32,
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

  const awayDirection = isLeft ? { x: 1, y: -1 } : { x: -1, y: -1 };

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const maxScale = Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / radius;

  const { gesture, animatedStyle, isActive, scale } = useDragToExpand({
    awayDirection,
    maxScale,
    onOpen,
    closeSignal,
  });

  const iconOpacityStyle = useAnimatedStyle(() => ({
    opacity: scale.value > iconHideScaleThreshold ? 0 : 1,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: scale.value > borderHideScaleThreshold ? 0 : 2,
  }));

  return (
    <View style={{ position: 'absolute', bottom: 0, [isLeft ? 'left' : 'right']: 0, width: 0, height: 0 }}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[
            {
              position: 'absolute',
              bottom: -cornerOffset,
              [isLeft ? 'left' : 'right']: -cornerOffset,
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
                backgroundColor: isActive ? activeFillColor : fillColor,
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
  );
}