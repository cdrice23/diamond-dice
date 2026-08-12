import { PersistentNav } from '@/components/navigation/components/persistent-nav.component';
import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';

const NO_PERSISTENT_NAV_ROUTES = ['/game-setup'];

export default function AppLayout() {
  const pathname = usePathname();
  const showPersistentNav = !NO_PERSISTENT_NAV_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} initialRouteName="home">
        <Stack.Screen name="game-setup" options={{ animation: 'none' }} />
      </Stack>
      {showPersistentNav && <PersistentNav />}
    </View>
  );
}