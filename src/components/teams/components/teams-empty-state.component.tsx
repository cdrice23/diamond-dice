import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

const EMPTY_STATE_ICON_SIZE = 48;

type TeamsEmptyStateProps = {
  isFiltered?: boolean;
};

export function TeamsEmptyState({ isFiltered = false }: TeamsEmptyStateProps) {
  const { colors } = useTheme();

  if (isFiltered) {
    return (
      <View className="items-center gap-3 px-8 pt-12">
        <PixelIcon name="jersey" size={EMPTY_STATE_ICON_SIZE} color={colors.mutedForeground} />
        <Text className="text-foreground text-2xl font-bold">{'No matching teams found :('}</Text>
        <Text variant="muted" className="text-center text-base">
          Try a different search term or format filter.
        </Text>
      </View>
    );
  }

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