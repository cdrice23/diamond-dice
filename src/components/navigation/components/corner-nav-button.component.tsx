import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useCornerDrag } from '../hooks/use-corner-drag.hook';

type CornerNavButtonProps = {
  corner: 'left' | 'right';
  size?: number;
  borderColor: string;
  fillColor: string;
  label: string;
  onPress: () => void;
  onPitch: () => void;
  iconSize?: number;
  children?: React.ReactNode;
};

export function CornerNavButton({
  corner,
  size = 100,
  borderColor,
  fillColor,
  label,
  onPress,
  onPitch,
  iconSize = 32,
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
  const { panGesture, animatedStyle } = useCornerDrag({ awayDirection, onPitch });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  const composedGesture = Gesture.Race(tapGesture, panGesture);

  return (
    <View style={{ position: 'absolute', bottom: 0, [isLeft ? 'left' : 'right']: 0, width: 0, height: 0 }}>
      <GestureDetector gesture={composedGesture}>
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
          <View
            style={{
              position: 'absolute',
              width: circleDiameter,
              height: circleDiameter,
              borderRadius: radius,
              backgroundColor: fillColor,
              borderWidth: 2,
              borderColor,
            }}
            pointerEvents="none"
          />
          <View
            style={{
              position: 'absolute',
              bottom: iconLocalPosition - iconSize / 2,
              [isLeft ? 'left' : 'right']: iconLocalPosition - iconSize / 2,
              width: iconSize,
              height: iconSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pointerEvents="none"
          >
            {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}