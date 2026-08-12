import { Text } from '@/components/primitives/text.component';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

type MenuItemButtonProps = {
  label: string;
  index: number;
  activeIndex: SharedValue<number>;
  primaryColor: string;
  backgroundColor: string;
  onLayout: (index: number, y: number, height: number) => void;
};

// Placeholder for the future pixel-sprite icon (Phase 2) -- a plain
// colored square for now, blinking while this item is active. Swap the
// visual here once real pixel-art assets exist; the blink/positioning
// logic around it shouldn't need to change.
function PlaceholderSpriteIcon({ isActive, color }: { isActive: boolean; color: string }) {
  const blink = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      blink.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
    } else {
      blink.value = 0;
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    opacity: blink.value,
  }));

  if (!isActive) return null;

  return <Animated.View style={[{ width: 16, height: 16, backgroundColor: color, marginRight: 12 }, style]} />;
}

// Fixed size, not content-dependent -- same highlight bounds regardless of
// label length ("Stats" vs "Player Database").
const HIGHLIGHT_WIDTH = 300;
const HIGHLIGHT_HEIGHT = 56;

export function MenuItemButton({ label, index, activeIndex, primaryColor, backgroundColor, onLayout }: MenuItemButtonProps) {
  const scaleStyle = useAnimatedStyle(() => {
    const active = activeIndex.value === index;
    return {
      transform: [{ scale: withTiming(active ? 1.15 : 1, { duration: 150 }) }],
    };
  });

  // Opacity, not backgroundColor, is what's actually animated -- avoids
  // Reanimated's color interpolation entirely, which is the likely cause
  // background wasn't appearing (this project's theme colors are
  // space-separated HSL strings, the same format that broke
  // react-native-svg's gradient parsing elsewhere in this feature).
  // The background itself is a separate, statically-colored layer whose
  // opacity toggles, rather than an animated color value.
  const highlightOpacityStyle = useAnimatedStyle(() => {
    const active = activeIndex.value === index;
    return {
      opacity: withTiming(active ? 1 : 0, { duration: 150 }),
    };
  });

  // Bridges the shared activeIndex value back to plain React state, ONLY
  // for the blink icon's mount/unmount -- useAnimatedReaction watches the
  // shared value on the UI thread and calls back to JS only when the
  // derived boolean actually changes, not on every frame.
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
        <PlaceholderSpriteIcon isActive={isActiveState} color={primaryColor} />
        <Text style={{ fontSize: 32, lineHeight: 38, textTransform: 'uppercase' }}>{label}</Text>
      </View>
    </Animated.View>
  );
}