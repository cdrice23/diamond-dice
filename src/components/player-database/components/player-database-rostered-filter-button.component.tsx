import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';
import { PlayerDatabaseFilterChipButton } from './player-database-filter-chip-button.component';

export function PlayerDatabaseRosteredFilterButton() {
  const { colors } = useTheme();

  return (
    <View className="opacity-50" pointerEvents="none">
      <PlayerDatabaseFilterChipButton
        label="On My Roster"
        isActive={false}
        activeColor={colors.level2}
        onPress={() => {}}
        accessibilityLabel="On my roster filter, not yet available"
      />
    </View>
  );
}