import { PlayerDatabaseFilterChipButton } from '@/components/player-database/components/player-database-filter-chip-button.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

const CHIP_BACKGROUND_ALPHA = 0.15;
const CHIP_BORDER_ALPHA = 0.35;
const CHIP_HEIGHT = 40;

type FriendsFilterBarProps = {
  onlineOnly: boolean;
  onOnlineOnlyChange: (next: boolean) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
};

export function FriendsFilterBar({ onlineOnly, onOnlineOnlyChange, hasActiveFilters, onClearAll }: FriendsFilterBarProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row gap-2 px-4 pb-3" style={{ height: CHIP_HEIGHT }}>
      <View style={{ flex: 2, height: CHIP_HEIGHT }}>
        <PlayerDatabaseFilterChipButton
          label="Show Online"
          isActive={onlineOnly}
          activeColor={colors.level1}
          onPress={() => onOnlineOnlyChange(!onlineOnly)}
          accessibilityLabel={`Show online friends only, ${onlineOnly ? 'enabled' : 'disabled'}`}
          inactiveBackgroundColor={adjustHslAlpha(colors.level1, CHIP_BACKGROUND_ALPHA)}
          inactiveBorderColor={adjustHslAlpha(colors.level1, CHIP_BORDER_ALPHA)}
          fullWidth
          className="h-full"
        />
      </View>
      <View style={{ flex: 1, height: CHIP_HEIGHT }}>
        <PlayerDatabaseFilterChipButton
          label="Clear All"
          isActive={false}
          activeColor={colors.mutedForeground}
          onPress={onClearAll}
          accessibilityLabel="Clear all filters"
          inactiveBackgroundColor={adjustHslAlpha(colors.mutedForeground, CHIP_BACKGROUND_ALPHA)}
          inactiveBorderColor={adjustHslAlpha(colors.mutedForeground, CHIP_BORDER_ALPHA)}
          disabled={!hasActiveFilters}
          fullWidth
          className="h-full"
        />
      </View>
    </View>
  );
}