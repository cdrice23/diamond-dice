import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import '@/global.css';
import { SessionProvider, useSession } from '@/utils/session-provider';
import { NAV_THEME } from '@/utils/theme';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/utils/theme-provider';
import { Poppins_200ExtraLight } from '@expo-google-fonts/poppins';
import { Silkscreen_400Regular } from '@expo-google-fonts/silkscreen';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { View } from 'react-native';

function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <LoadingSpinner size={80} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ VT323_400Regular, Silkscreen_400Regular, Poppins_200ExtraLight });

  return (
    <AppThemeProvider>
      {!fontsLoaded ? (
        <LoadingScreen />
      ) : (
        <SessionProvider>
          <RootLayoutNav />
        </SessionProvider>
      )}
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useTheme();
  const { session, isLoading, isPasswordRecovery } = useSession();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!session && !isPasswordRecovery;

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? NAV_THEME.dark : NAV_THEME.light}>
      <Stack>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <PortalHost />
    </NavThemeProvider>
  );
}