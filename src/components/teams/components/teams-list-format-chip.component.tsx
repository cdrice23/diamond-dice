import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

type TeamsListCardFormatChipProps = {
  formatName: string;
  size?: 'sm' | 'lg';
};

export function TeamsListCardFormatChip({ formatName, size = 'sm' }: TeamsListCardFormatChipProps) {
  const { colors } = useTheme();
  const isLarge = size === 'lg';

  return (
    <View
      className={isLarge ? 'rounded-md px-3.5 py-2' : 'rounded-sm px-2.5 py-1'}
      style={{
        backgroundColor: adjustHslAlpha(colors.level2, 0.15),
        borderWidth: 1,
        borderColor: adjustHslAlpha(colors.level2, 0.35),
      }}
    >
      <Text style={{ color: colors.level2 }} className={isLarge ? 'text-lg font-semibold' : 'text-sm font-semibold'}>
        {formatName}
      </Text>
    </View>
  );
}