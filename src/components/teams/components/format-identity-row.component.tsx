import { Text } from '@/components/primitives/text.component';
import { FORMAT_ICON_MAP } from '@/components/teams/teams.constants';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

type FormatIdentityRowProps = {
  formatName: string;
  iconSize?: number;
  textClassName?: string;
};

export function FormatIdentityRow({ formatName, iconSize = 20, textClassName = 'text-base font-semibold' }: FormatIdentityRowProps) {
  const { colors } = useTheme();
  const icon = FORMAT_ICON_MAP[formatName] ?? 'help-circle-outline';

  return (
    <View className="flex-row items-center gap-1.5">
      <MaterialCommunityIcons name={icon} size={iconSize} color={colors.foreground} />
      <Text className={`text-foreground ${textClassName}`}>{formatName}</Text>
    </View>
  );
}