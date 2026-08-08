import { PersistentNav } from '@/components/navigation/persistent-nav.component';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <PersistentNav />
    </View>
  );
}