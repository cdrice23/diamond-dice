import { LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type StrikeZoneProps = {
  visibility: SharedValue<number>;
  borderColor: string;
  onLayout?: (x: number, y: number, width: number, height: number) => void;
};

const WIDTH = 80;
const HEIGHT = 110;

export function StrikeZone({ visibility, borderColor, onLayout }: StrikeZoneProps) {
  const style = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  function handleLayout(e: LayoutChangeEvent) {
    const { x, y, width, height } = e.nativeEvent.layout;
    onLayout?.(x, y, width, height);
  }

  return (
    <Animated.View
      onLayout={handleLayout}
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: WIDTH,
          height: HEIGHT,
          marginLeft: -WIDTH / 2,
          marginTop: -HEIGHT / 2,
          borderWidth: 3,
          borderColor,
          borderRadius: 4,
        },
        style,
      ]}
    />
  );
}