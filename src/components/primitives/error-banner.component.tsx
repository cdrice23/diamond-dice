import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row gap-2.5 rounded-md p-3"
      style={{ backgroundColor: adjustHslAlpha(colors.destructive, 0.1), borderWidth: 1, borderColor: colors.destructive }}
    >
      <MaterialCommunityIcons name="alert-outline" size={20} color={colors.destructive} />
      <Text style={{ color: colors.destructive }} className="flex-1 text-sm font-medium">
        {message}
      </Text>
    </View>
  );
}