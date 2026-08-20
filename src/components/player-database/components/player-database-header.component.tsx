import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

export function PlayerDatabaseHeader() {
  return (
    <View className="px-4 pb-4 pt-28">
      <Text className="text-foreground text-3xl font-bold">Player Database</Text>
    </View>
  );
}