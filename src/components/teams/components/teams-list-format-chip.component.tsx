import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

type TeamsListCardFormatChipProps = {
  formatName: string;
};

export function TeamsListCardFormatChip({ formatName }: TeamsListCardFormatChipProps) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-sm px-2.5 py-1"
      style={{
        backgroundColor: adjustHslAlpha(colors.level2, 0.15),
        borderWidth: 1,
        borderColor: adjustHslAlpha(colors.level2, 0.35),
      }}
    >
      <Text style={{ color: colors.level2 }} className="text-sm font-semibold">
        {formatName}
      </Text>
    </View>
  );
}