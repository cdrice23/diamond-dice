import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

const EMPTY_STATE_ICON_SIZE = 48;

export function TeamsEmptyState() {
  const { colors } = useTheme();

  return (
    <View className="items-center gap-3 px-8 pt-12">
      <PixelIcon name="jersey" size={EMPTY_STATE_ICON_SIZE} color={colors.mutedForeground} />
      <Text className="text-foreground text-2xl font-bold">{'No teams yet :('}</Text>
      <Text variant="muted" className="text-center text-base">
        Tap + to build your first team!
      </Text>
    </View>
  );
}