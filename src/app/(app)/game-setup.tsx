import { Button } from '@/components/primitives/button.component';
import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function GameSetupScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <PlaceholderScreen title="Game Setup" accentColor={colors.level1} />
      <View style={{ position: 'absolute', top: 60, right: 24 }}>
        <Button variant="ghost" onPress={() => router.push('/(app)/home')}>
          <Text>Back to Home</Text>
        </Button>
      </View>
    </View>
  );
}