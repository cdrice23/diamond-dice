import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

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

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 active:opacity-70 ${fullWidth ? 'flex-1' : ''} ${disabled ? 'opacity-40' : ''} ${className ?? ''}`}
      style={{
        borderColor: isActive ? activeColor : resolvedInactiveBorder,
        backgroundColor: isActive ? activeColor : inactiveBackgroundColor,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {leading}
      <Text
        style={{ color: isActive ? '#FFFFFF' : resolvedInactiveText }}
        className="text-sm font-semibold"
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}