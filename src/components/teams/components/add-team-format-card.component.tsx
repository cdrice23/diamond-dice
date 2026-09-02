import { FormatIdentityRow } from '@/components/teams/components/format-identity-row.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useRef } from 'react';
import { Easing, LayoutAnimation, Pressable, Animated as RNAnimated, Text, View } from 'react-native';

const COLOR_ANIMATION_DURATION = 300;
const LAYOUT_UPDATE_DURATION = 500;
const TEXT_FADE_DURATION = 200;
const THEME_BODY_FONT = 'VT323_400Regular';
const DESCRIPTION_FONT_SIZE = 16;
const FOCUS_TINT_OPACITY = 0.12;
const CARD_BORDER_WIDTH = 2;

type AddTeamFormatCardProps = {
  name: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
};

export function AddTeamFormatCard({ name, description, isSelected, onPress }: AddTeamFormatCardProps) {
  const { colors } = useTheme();
  const colorProgress = useRef(new RNAnimated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(colorProgress, {
      toValue: isSelected ? 1 : 0,
      duration: COLOR_ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isSelected, colorProgress]);

  const borderColor = colorProgress.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.level2] });
  const backgroundColor = colorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', adjustHslAlpha(colors.level2, FOCUS_TINT_OPACITY)],
  });

  function handlePress() {
    LayoutAnimation.configureNext({
      duration: LAYOUT_UPDATE_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity, duration: TEXT_FADE_DURATION },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity, duration: TEXT_FADE_DURATION },
    });
    onPress();
  }

  return (
    <RNAnimated.View style={{ borderRadius: 12, borderWidth: CARD_BORDER_WIDTH, borderColor, backgroundColor, overflow: 'hidden' }}>
      <Pressable onPress={handlePress} className="active:opacity-70">
        <View className="p-4">
          <FormatIdentityRow formatName={name} iconSize={22} textClassName={isSelected ? 'text-xl font-bold' : 'text-lg font-bold'} />
        </View>

        {isSelected && (
          <Text
            style={{
              fontFamily: THEME_BODY_FONT,
              fontSize: DESCRIPTION_FONT_SIZE,
              color: colors.mutedForeground,
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            {description}
          </Text>
        )}
      </Pressable>
    </RNAnimated.View>
  );
}