import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

type CardSectionHeaderProps = {
  label: string;
  accentColor?: string;
};

export function CardSectionHeader({ label, accentColor }: CardSectionHeaderProps) {
  const { colors } = useTheme();
  const resolvedAccent = accentColor ?? colors.level2;

  return (
    <View className="mb-4 flex-row items-center gap-2.5">
      <View style={{ width: 5, height: 22, borderRadius: 2.5, backgroundColor: resolvedAccent }} />
      <Text
        style={{ color: resolvedAccent, letterSpacing: 1.2 }}
        className="text-xl font-extrabold uppercase"
      >
        {label}
      </Text>
    </View>
  );
}