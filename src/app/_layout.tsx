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
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <LoadingSpinner size={80} />
    </View>
  );
}

const FALLBACK_COLORS = {
  background: '#F7F7F7',
  foreground: '#05162A',
  mutedForeground: '#6B7280',
  accent: '#6BA4E7',
  accentText: '#05162A',
};

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: FALLBACK_COLORS.background, padding: 24, gap: 16 }}>
      <Text style={{ color: FALLBACK_COLORS.foreground, fontSize: 18, textAlign: 'center' }}>Something went wrong.</Text>
      <Text style={{ color: FALLBACK_COLORS.mutedForeground, fontSize: 14, textAlign: 'center' }}>{error.message}</Text>
      <Pressable
        onPress={retry}
        style={{ backgroundColor: FALLBACK_COLORS.accent, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 }}
      >
        <Text style={{ color: FALLBACK_COLORS.accentText }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ VT323_400Regular, Silkscreen_400Regular, Poppins_200ExtraLight });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          {!fontsLoaded ? (
            <LoadingScreen />
          ) : (
            <SessionProvider>
              <RootLayoutNav />
            </SessionProvider>
          )}
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
      <Stack screenOptions={{ headerShown: false }}>
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