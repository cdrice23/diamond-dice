import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type TeamDetailViewMode = 'list' | 'field';

type TeamDetailViewToggleProps = {
  mode: TeamDetailViewMode;
  onChange: (mode: TeamDetailViewMode) => void;
  activeColor: string;
  activeIconColor: string;
  inactiveColor: string;
};

const SEGMENT_WIDTH = 36;
const SEGMENT_HEIGHT = 30;

export function TeamDetailViewToggle({ mode, onChange, activeColor, activeIconColor, inactiveColor }: TeamDetailViewToggleProps) {
  const { colors } = useTheme();
  const slide = useSharedValue(mode === 'list' ? 0 : 1);

  useEffect(() => {
    slide.value = withTiming(mode === 'list' ? 0 : 1, { duration: 200 });
  }, [mode, slide]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * SEGMENT_WIDTH }],
  }));

  return (
    <View className="flex-row rounded-sm border" style={{ borderColor: colors.border, overflow: 'hidden' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: SEGMENT_WIDTH, height: SEGMENT_HEIGHT, backgroundColor: activeColor },
          highlightStyle,
        ]}
      />

      <Pressable
        onPress={() => onChange('list')}
        hitSlop={4}
        accessibilityLabel="List view"
        accessibilityRole="button"
        style={{ width: SEGMENT_WIDTH, height: SEGMENT_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
      >
        <MaterialCommunityIcons name="view-list" size={18} color={mode === 'list' ? activeIconColor : inactiveColor} />
      </Pressable>

      <Pressable
        onPress={() => onChange('field')}
        hitSlop={4}
        accessibilityLabel="Field view"
        accessibilityRole="button"
        style={{ width: SEGMENT_WIDTH, height: SEGMENT_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
      >
        <MaterialCommunityIcons name="baseball-diamond-outline" size={18} color={mode === 'field' ? activeIconColor : inactiveColor} />
      </Pressable>
    </View>
  );
}