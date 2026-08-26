import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

export function PlayerDetailBackButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      className="mb-1 flex-row items-center gap-1.5 self-start rounded-full px-3"
      style={{ backgroundColor: colors.muted }}
    >
      <Ionicons name="chevron-back" size={22} color={colors.foreground} />
      <Text className="text-foreground text-xl font-semibold">Go Back</Text>
    </Pressable>
  );
}