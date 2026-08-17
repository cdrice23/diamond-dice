import { Text } from '@/components/primitives/text.component';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function PlayerRecordScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();

  return (
    <View className="bg-background flex-1 items-center justify-center px-4">
      <Text className="text-foreground text-lg font-semibold">Player Record</Text>
      <Text variant="muted" className="mt-2">
        Player ID: {playerId}
      </Text>
      <Text variant="muted" className="mt-4 text-center">
        Full player record view coming in Epic 6.
      </Text>
    </View>
  );
}