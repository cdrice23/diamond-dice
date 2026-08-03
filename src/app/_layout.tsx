import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import '@/global.css';
import { SessionProvider, useSession } from '@/utils/session-provider';
import { NAV_THEME, THEME } from '@/utils/theme';
import { Silkscreen_400Regular } from '@expo-google-fonts/silkscreen';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useColorScheme, View } from 'react-native';

function LoadingScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <LoadingSpinner size={80} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ VT323_400Regular, Silkscreen_400Regular });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, isLoading, isPasswordRecovery } = useSession();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!session && !isPasswordRecovery;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? NAV_THEME.dark : NAV_THEME.light}>
      <Stack>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}