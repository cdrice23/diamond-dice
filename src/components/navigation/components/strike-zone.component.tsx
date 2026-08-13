import { useEffect, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StrikeZoneProps = {
  visibility: SharedValue<number>;
  borderColor: string;
  onLayout?: (x: number, y: number, width: number, height: number) => void;
};

const WIDTH = 80;
const HEIGHT = 110;

export function StrikeZone({ visibility, borderColor, onLayout }: StrikeZoneProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const style = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  const zoneRef = useRef<any>(null);
  useEffect(() => {
    if (!onLayout) return;
    const timeout = setTimeout(() => {
      zoneRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        onLayout(x, y, width, height);
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [onLayout]);

  const topPosition = insets.top + (screenHeight - insets.top) * 0.25;

  return (
    <View
      ref={zoneRef}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: topPosition,
        left: '50%',
        width: WIDTH,
        height: HEIGHT,
        marginLeft: -WIDTH / 2,
        marginTop: -HEIGHT / 2,
        zIndex: 10,
      }}
    >
      <Animated.View
        style={[
          {
            width: WIDTH,
            height: HEIGHT,
            borderWidth: 3,
            borderColor,
            borderRadius: 4,
          },
          style,
        ]}
      />
    </View>
  );
}