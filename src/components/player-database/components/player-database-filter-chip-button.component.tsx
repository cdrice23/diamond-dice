import { Text } from '@/components/primitives/text.component';
import { adjustHslLightness } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { cn } from '@/utils/utils';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type PlayerDatabaseFilterChipButtonProps = {
  label: string;
  isActive: boolean;
  activeColor: string;
  onPress: () => void;
  accessibilityLabel: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  inactiveBackgroundColor?: string;
  inactiveTextColor?: string;
  inactiveBorderColor?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

const GRADIENT_LIGHTEN_PERCENT = 4;
const GRADIENT_DARKEN_PERCENT = -4;

export function PlayerDatabaseFilterChipButton({
  label,
  isActive,
  activeColor,
  onPress,
  accessibilityLabel,
  leading,
  trailing,
  inactiveBackgroundColor = 'transparent',
  inactiveTextColor,
  inactiveBorderColor,
  fullWidth = false,
  disabled = false,
  className,
}: PlayerDatabaseFilterChipButtonProps) {
  const { colors } = useTheme();
  const resolvedInactiveText = inactiveTextColor ?? colors.foreground;
  const resolvedInactiveBorder = inactiveBorderColor ?? colors.border;

  const lightStop = adjustHslLightness(activeColor, GRADIENT_LIGHTEN_PERCENT);
  const darkStop = adjustHslLightness(activeColor, GRADIENT_DARKEN_PERCENT);

  return (
    <View
      className={cn(
        'overflow-hidden rounded-sm border',
        fullWidth ? 'flex-1' : '',
        disabled ? 'opacity-40' : '',
        className
      )}
      style={{ borderColor: isActive ? activeColor : resolvedInactiveBorder }}
    >
      {isActive ? (
        <LinearGradient colors={[lightStop, darkStop]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
          <Pressable
            onPress={onPress}
            disabled={disabled}
            className="flex-1 flex-row items-center justify-center gap-1.5 px-2.5 py-1.5 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
          >
            {leading}
            <Text style={{ color: '#F7F7F7' }} className="text-sm font-semibold" numberOfLines={1}>
              {label}
            </Text>
            {trailing}
          </Pressable>
        </LinearGradient>
      ) : (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          className="flex-1 flex-row items-center justify-center gap-1.5 px-2.5 py-1.5 active:opacity-70"
          style={{ backgroundColor: inactiveBackgroundColor }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {leading}
          <Text style={{ color: resolvedInactiveText }} className="text-sm font-semibold" numberOfLines={1}>
            {label}
          </Text>
          {trailing}
        </Pressable>
      )}
    </View>
  );
}