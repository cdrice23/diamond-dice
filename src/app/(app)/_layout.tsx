import { PersistentNav } from '@/components/navigation/components/persistent-nav.component';
import { useDragToPitch } from '@/components/navigation/hooks/use-drag-to-pitch.hook';
import { PitchStateProvider } from '@/components/navigation/pitch-state.context';
import { useTheme } from '@/utils/theme-provider';
import { Stack, router, usePathname } from 'expo-router';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

const NO_PERSISTENT_NAV_ROUTES = ['/game-setup'];

type Bounds = { x: number; y: number; width: number; height: number };

export default function AppLayout() {
  const { colors } = useTheme();

  const pathname = usePathname();
  const showPersistentNav = !NO_PERSISTENT_NAV_ROUTES.some((route) => pathname.startsWith(route));

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [strikeZoneBounds, setStrikeZoneBounds] = useState<Bounds | null>(null);

  const buttonRadius = (100 + 100 * 0.05 * 0.85) / 2;
  const maxScale = Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / buttonRadius;
  const buttonAnchor = {
    x: buttonRadius - 100 * 0.05,
    y: screenHeight - (buttonRadius - 100 * 0.05),
  };
  const stoppingLineY = strikeZoneBounds
    ? strikeZoneBounds.y + strikeZoneBounds.height - buttonAnchor.y
    : -300;

  const playDrag = useDragToPitch({
    maxScale,
    buttonAnchor,
    strikeZoneBounds,
    stoppingLineY,
    outerPadding: 40,
    onOpen: () => router.push('/(app)/game-setup'),
    closeSignal: 0,
  });

  const PITCH_PHASE_COLORS: Record<string, string | undefined> = {
    rest: undefined,
    pitching: colors.primary,
    strike: colors.level1,
    ball: colors.level3,
  };
  const ballFillColorOverride = PITCH_PHASE_COLORS[playDrag.pitchPhase];
  const strikeZoneColor =
    playDrag.pitchPhase === 'strike' ? colors.level1 : playDrag.pitchPhase === 'ball' ? colors.level3 : colors.primary;

  function handlePlayButtonLayout(x: number, y: number, width: number, height: number) {
    // Intentionally unused for now -- see comment above.
  }

  return (
    <View style={{ flex: 1 }}>
      <PitchStateProvider pastThreshold={playDrag.pastThreshold}>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} initialRouteName="home">
          <Stack.Screen name="game-setup" options={{ animation: 'none' }} />
        </Stack>
      </PitchStateProvider>
      {showPersistentNav && (
        <PersistentNav
          playDrag={playDrag}
          ballFillColorOverride={ballFillColorOverride}
          strikeZoneColor={strikeZoneColor}
          strikeZoneBounds={strikeZoneBounds}
          onStrikeZoneLayout={(x, y, width, height) => setStrikeZoneBounds({ x, y, width, height })}
          onPlayButtonLayout={handlePlayButtonLayout}
        />
      )}
    </View>
  );
}