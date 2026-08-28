import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function EditTeamScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  return (
    <View className="bg-background flex-1 items-center justify-center">
      <Text className="text-foreground text-lg">Edit Team — {teamId}</Text>
    </View>
  );
}