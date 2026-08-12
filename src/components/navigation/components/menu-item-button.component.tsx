import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import type { PixelIconName } from '@/components/branding/pixel-icon-data';
import { Text } from '@/components/primitives/text.component';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

type MenuItemButtonProps = {
  label: string;
  iconName: PixelIconName;
  index: number;
  activeIndex: SharedValue<number>;
  primaryColor: string;
  backgroundColor: string;
  onLayout: (index: number, y: number, height: number) => void;
};

const BLINK_HOLD_MS = 550;

function BlinkingIcon({ isActive, children }: { isActive: boolean; children: React.ReactNode }) {
  const blink = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      blink.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withDelay(BLINK_HOLD_MS, withTiming(0, { duration: 0 })),
          withDelay(BLINK_HOLD_MS, withTiming(1, { duration: 0 }))
        ),
        -1,
        false
      );
    } else {
      blink.value = 0;
    }
  }, [isActive, blink]);

  const style = useAnimatedStyle(() => ({
    opacity: blink.value,
  }));

  if (!isActive) return null;

  return <Animated.View style={[{ marginRight: 12 }, style]}>{children}</Animated.View>;
}

const HIGHLIGHT_WIDTH = 300;
const HIGHLIGHT_HEIGHT = 56;

export function MenuItemButton({ label, iconName, index, activeIndex, primaryColor, backgroundColor, onLayout }: MenuItemButtonProps) {
  const scaleStyle = useAnimatedStyle(() => {
    const active = activeIndex.value === index;
    return {
      transform: [{ scale: withTiming(active ? 1.15 : 1, { duration: 150 }) }],
    };
  });

  const highlightOpacityStyle = useAnimatedStyle(() => {
    const active = activeIndex.value === index;
    return {
      opacity: withTiming(active ? 1 : 0, { duration: 150 }),
    };
  });

  const [isActiveState, setIsActiveState] = useState(false);
  useAnimatedReaction(
    () => activeIndex.value === index,
    (isActive, previous) => {
      if (isActive !== previous) {
        runOnJS(setIsActiveState)(isActive);
      }
    }
  );

  function handleLayout(e: LayoutChangeEvent) {
    onLayout(index, e.nativeEvent.layout.y, e.nativeEvent.layout.height);
  }

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[{ alignItems: 'center', justifyContent: 'center' }, scaleStyle]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: HIGHLIGHT_WIDTH,
            height: HIGHLIGHT_HEIGHT,
            borderRadius: 8,
            backgroundColor: backgroundColor,
          },
          highlightOpacityStyle,
        ]}
        pointerEvents="none"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24 }}>
        <BlinkingIcon isActive={isActiveState}>
          <PixelIcon name={iconName} size={24} color={primaryColor} />
        </BlinkingIcon>
        <Text style={{ fontSize: 32, lineHeight: 38, textTransform: 'uppercase' }}>{label}</Text>
      </View>
    </Animated.View>
  );
}