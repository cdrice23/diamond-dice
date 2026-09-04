import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

type ScreenDetailBackButtonProps = {
  flat?: boolean;
  textColor?: string;
  onPress?: () => void;
};

export function ScreenDetailBackButton({ flat = false, textColor, onPress }: ScreenDetailBackButtonProps) {
  const { colors } = useTheme();
  const resolvedColor = textColor ?? colors.foreground;

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      className="mb-1 flex-row items-center gap-1.5 self-start px-3"
      style={flat ? undefined : { backgroundColor: colors.muted, borderRadius: 9999 }}
    >
      <Ionicons name="chevron-back" size={22} color={resolvedColor} />
      <Text style={{ color: resolvedColor }} className="text-xl font-semibold">
        Go Back
      </Text>
    </Pressable>
  );
}