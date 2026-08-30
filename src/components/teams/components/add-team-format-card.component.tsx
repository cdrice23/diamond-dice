import { FormatIdentityRow } from '@/components/teams/components/format-identity-row.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useRef, useState } from 'react';
import { Easing, Pressable, Animated as RNAnimated, Text, View } from 'react-native';

const ANIMATION_DURATION = 300;
const THEME_BODY_FONT = 'VT323_400Regular';
const DESCRIPTION_FONT_SIZE = 16;
const FOCUS_TINT_OPACITY = 0.12;

type AddTeamFormatCardProps = {
  name: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
};

export function AddTeamFormatCard({ name, description, isSelected, onPress }: AddTeamFormatCardProps) {
  const { colors } = useTheme();
  const progress = useRef(new RNAnimated.Value(isSelected ? 1 : 0)).current;
  const [descriptionHeight, setDescriptionHeight] = useState(0);

  useEffect(() => {
    RNAnimated.timing(progress, {
      toValue: isSelected ? 1 : 0,
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isSelected, progress]);

  const borderWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const descriptionAnimatedHeight = progress.interpolate({ inputRange: [0, 1], outputRange: [0, descriptionHeight] });

  return (
    <RNAnimated.View
      style={{
        borderRadius: 12,
        borderWidth,
        borderColor: isSelected ? colors.level2 : colors.border,
        backgroundColor: isSelected ? adjustHslAlpha(colors.level2, FOCUS_TINT_OPACITY) : 'transparent',
        overflow: 'hidden',
      }}
    >
      <Pressable onPress={onPress} className="active:opacity-70">
        <View className="p-4">
          <FormatIdentityRow formatName={name} iconSize={22} textClassName={isSelected ? 'text-xl font-bold' : 'text-lg font-bold'} />
        </View>

        <View style={{ position: 'relative' }}>
          <Text
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: 0,
              fontFamily: THEME_BODY_FONT,
              fontSize: DESCRIPTION_FONT_SIZE,
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
            onLayout={(e) => {
              const measured = e.nativeEvent.layout.height;
              if (measured > 0 && measured !== descriptionHeight) setDescriptionHeight(measured);
            }}
          >
            {description}
          </Text>
          <RNAnimated.View style={{ height: descriptionAnimatedHeight, overflow: 'hidden' }}>
            <RNAnimated.Text
              style={{
                fontFamily: THEME_BODY_FONT,
                opacity: progress,
                fontSize: DESCRIPTION_FONT_SIZE,
                color: colors.mutedForeground,
                paddingHorizontal: 16,
                paddingBottom: 12,
              }}
            >
              {description}
            </RNAnimated.Text>
          </RNAnimated.View>
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}