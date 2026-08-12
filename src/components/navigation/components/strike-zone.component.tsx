import { useEffect, useRef } from 'react';
import { View } from 'react-native';
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

  return (
    <View
      ref={zoneRef}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: WIDTH,
        height: HEIGHT,
        marginLeft: -WIDTH / 2,
        marginTop: -HEIGHT / 2,
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