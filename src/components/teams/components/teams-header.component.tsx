import { PlayerDatabaseFilterChipButton } from '@/components/player-database/components/player-database-filter-chip-button.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

type TeamsHeaderProps = {
  onAddTeamPress: () => void;
};

export function TeamsHeader({ onAddTeamPress }: TeamsHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center justify-between px-4 pb-4 pt-20">
      <Text className="text-foreground text-3xl font-bold">Team Clubhouse</Text>
      <PlayerDatabaseFilterChipButton
        label="Add Team"
        isActive
        activeColor={colors.level2}
        onPress={onAddTeamPress}
        accessibilityLabel="Add team"
        trailing={<Ionicons name="add" size={16} color="#FFFFFF" />}
      />
    </View>
  );
}