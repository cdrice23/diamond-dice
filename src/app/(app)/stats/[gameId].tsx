import { Text } from '@/components/primitives/text.component';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function GameStatsScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();

  return (
    <View className="bg-background flex-1 items-center justify-center px-4">
      <Text className="text-foreground text-lg font-semibold">Game Stats</Text>
      <Text variant="muted" className="mt-2">
        Game ID: {gameId}
      </Text>
      <Text variant="muted" className="mt-4 text-center">
        Full game stats view coming in Epic 13.
      </Text>
    </View>
  );
}