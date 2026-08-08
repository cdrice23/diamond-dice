import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

export default function GameSetupScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} className="bg-background">
      <Text>Game setup (placeholder)</Text>
    </View>
  );
}