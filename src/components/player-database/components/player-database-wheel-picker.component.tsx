import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useWheelPicker } from '../hooks/use-wheel-picker.hook';

type PlayerDatabaseWheelPickerProps = {
  values: number[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
};

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 7;
export const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = (VISIBLE_ITEMS - 1) / 2;

function WheelItem({
  label,
  index,
  translateY,
  foregroundColor,
  selectedColor,
}: {
  label: string;
  index: number;
  translateY: SharedValue<number>;
  foregroundColor: string;
  selectedColor: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distanceFromCenter = index * ITEM_HEIGHT + translateY.value;
    const absDistance = Math.abs(distanceFromCenter);
    const opacity = interpolate(absDistance, [0, ITEM_HEIGHT, ITEM_HEIGHT * 2], [1, 0.5, 0.2], Extrapolation.CLAMP);
    const scale = interpolate(absDistance, [0, ITEM_HEIGHT, ITEM_HEIGHT * 2], [2, 1.2, 0.85], Extrapolation.CLAMP);
    const color = interpolateColor(absDistance, [0, ITEM_HEIGHT], [selectedColor, foregroundColor]);

    return { opacity, transform: [{ scale }], color };
  });

  return (
    <Animated.View style={{ height: ITEM_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text className="font-body text-2xl font-bold" style={animatedStyle}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

export function PlayerDatabaseWheelPicker({ values, selectedIndex, onIndexChange }: PlayerDatabaseWheelPickerProps) {
  const { colors } = useTheme();
  const { gesture, translateY, containerStyle } = useWheelPicker(values.length, ITEM_HEIGHT, selectedIndex, onIndexChange);

  return (
    <View style={{ height: WHEEL_HEIGHT, width: '100%', overflow: 'hidden' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          collapsable={false}
          style={[
            { paddingTop: CENTER_OFFSET * ITEM_HEIGHT, paddingBottom: CENTER_OFFSET * ITEM_HEIGHT, width: '100%' },
            containerStyle,
          ]}
        >
          {values.map((value, index) => (
            <WheelItem
              key={value}
              label={String(value)}
              index={index}
              translateY={translateY}
              foregroundColor={colors.foreground}
              selectedColor={colors.level2}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}