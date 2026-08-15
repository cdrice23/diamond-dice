import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDragToExpand } from '../hooks/use-drag-to-expand.hook';
import type { UseDragToPitchReturn } from '../hooks/use-drag-to-pitch.hook';
import { CornerNavButton } from './corner-nav-button.component';
import { HitWipeTransition } from './hit-wipe-transition.component';
import { HomePlateIcon } from './home-plate-icon.component';
import { MenuOverlay } from './menu-overlay.component';
import { PitchCurveBackdrop } from './pitch-curve-backdrop.component';
import { StrikeZone } from './strike-zone.component';

const WHITE = '#F7F7F7';

type PersistentNavProps = {
  playDrag: UseDragToPitchReturn;
  onStrikeZoneLayout: (x: number, y: number, width: number, height: number) => void;
  onPlayButtonLayout: (x: number, y: number, width: number, height: number) => void;
  ballFillColorOverride?: string;
  strikeZoneColor: string;
  strikeZoneBounds: { x: number; y: number; width: number; height: number } | null;
};

export function PersistentNav({
  playDrag,
  onStrikeZoneLayout,
  onPlayButtonLayout,
  ballFillColorOverride,
  strikeZoneColor,
  strikeZoneBounds,
}: PersistentNavProps) {
  const { colors, colorScheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [closeSignal, setCloseSignal] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  function handleCloseMenu() {
    setIsMenuOpen(false);
    setCloseSignal((n) => n + 1);
  }

  const { buttonRadius, maxScale } = useMemo(() => {
    const radius = (100 + 100 * 0.05 * 0.85) / 2;
    return { buttonRadius: radius, maxScale: Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / radius };
  }, [screenWidth, screenHeight]);

  const menuDrag = useDragToExpand({
    awayDirection: { x: -1, y: -1 },
    maxScale,
    onOpen: () => setIsMenuOpen(true),
    closeSignal,
  });

  const siblingFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - playDrag.pastThreshold.value,
  }));

  return (
    <>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, zIndex: 20 }} pointerEvents="box-none">
        <CornerNavButton
          corner="left"
          fillColor={WHITE}
          activeFillColor={colors.level1}
          fillColorOverride={ballFillColorOverride}
          borderColor={colors.level1}
          isPitching={playDrag.pitchPhase !== 'rest'}
          onButtonLayout={onPlayButtonLayout}
          label="Play"
          iconSize={36}
          gesture={playDrag.gesture}
          animatedStyle={playDrag.animatedStyle}
          scale={playDrag.scale}
          isActive={playDrag.isActive}
        >
          {(isActive) => <Ionicons name="add" size={36} color={isActive ? WHITE : colors.level1} />}
        </CornerNavButton>

        <Animated.View
          style={[
            { position: 'absolute', bottom: 0, right: 0, width: 0, height: 0 },
            siblingFadeStyle,
          ]}
        >
          <CornerNavButton
            corner="right"
            fillColor={WHITE}
            activeFillColor={colors.level2}
            borderColor={colors.level2}
            label="Menu"
            iconSize={36}
            gesture={menuDrag.gesture}
            animatedStyle={menuDrag.animatedStyle}
            scale={menuDrag.scale}
            isActive={menuDrag.isActive}
          >
            {(isActive) => <Ionicons name="menu" size={36} color={isActive ? WHITE : colors.level2} />}
          </CornerNavButton>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 32,
              left: '50%',
              transform: [{ translateX: -20 }],
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            },
            siblingFadeStyle,
          ]}
        >
          <Pressable
            onPress={() => router.push('/(app)/home')}
            accessibilityRole="button"
            accessibilityLabel="Home"
            hitSlop={12}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            {({ pressed }) => (
              <HomePlateIcon
                size={60}
                flat={pressed}
                showProminentBorder={colorScheme === 'light'}
              />
            )}
          </Pressable>
        </Animated.View>
      </View>

      <PitchCurveBackdrop
        strikeZoneBounds={strikeZoneBounds}
        visibility={playDrag.strikeZoneVisibility}
        pastThreshold={playDrag.pastThreshold}
        fillColor={colorScheme === 'light' ? "#C6C6C6" : "#1E2D3F"}
      />

      <HitWipeTransition
        isHit={playDrag.isHit}
        lineDrawProgress={playDrag.lineDrawProgress}
        hitWipeProgress={playDrag.hitWipeProgress}
        settleOffsetX={playDrag.settleOffsetX}
        settleOffsetY={playDrag.settleOffsetY}
        buttonAnchor={playDrag.buttonAnchor}
        fillColor={colors.level2}
        angles={playDrag.hitAngles}
        margin={playDrag.hitMargin}
        hitLineDistances={playDrag.hitLineDistances}
        isRightHanded={playDrag.hitIsRightHanded}
      />

      <StrikeZone
        visibility={playDrag.strikeZoneVisibility}
        borderColor={strikeZoneColor}
        onLayout={onStrikeZoneLayout}
      />

      <MenuOverlay visible={isMenuOpen} onClose={handleCloseMenu} accentColor={colors.level2} />
    </>
  );
}