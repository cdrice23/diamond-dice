import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useDragToExpand } from '../hooks/use-drag-to-expand.hook';
import { useDragToPitch } from '../hooks/use-drag-to-pitch.hook';
import { CornerNavButton } from './corner-nav-button.component';
import { HomePlateIcon } from './home-plate-icon.component';
import { MenuOverlay } from './menu-overlay.component';

const WHITE = '#F7F7F7';

export function PersistentNav() {
  const { colors, colorScheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [closeSignal, setCloseSignal] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  function handleCloseMenu() {
    setIsMenuOpen(false);
    setCloseSignal((n) => n + 1);
  }

  const buttonRadius = (100 + 100 * 0.05 * 0.85) / 2;
  const maxScale = Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / buttonRadius;

  const playDrag = useDragToPitch({
    awayDirection: { x: 1, y: -1 },
    maxScale,
    onOpen: () => router.push('/(app)/game-setup'),
    closeSignal: 0, 
  });

  const menuDrag = useDragToExpand({
    awayDirection: { x: -1, y: -1 },
    maxScale,
    onOpen: () => setIsMenuOpen(true),
    closeSignal,
  });

  return (
    <>
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} pointerEvents="box-none">
      <CornerNavButton
        corner="left"
        fillColor={WHITE}
        borderColor={colors.level1}
        label="Play"
        iconSize={36}
        gesture={playDrag.gesture}
        animatedStyle={playDrag.animatedStyle}
        scale={playDrag.scale}
        isActive={playDrag.isActive}
      >
        {(isActive) => <Ionicons name="add" size={36} color={isActive ? WHITE : colors.level1} />}
      </CornerNavButton>

      <CornerNavButton
        corner="right"
        fillColor={WHITE}
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

      <Pressable
        onPress={() => router.push('/(app)/home')}
        accessibilityRole="button"
        accessibilityLabel="Home"
        hitSlop={12}
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: [{ translateX: -20 }],
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {({ pressed }) => (
          <HomePlateIcon
            size={60}
            flat={pressed}
            showProminentBorder={colorScheme === 'light'}
          />
        )}
      </Pressable>
    </View>

    <MenuOverlay visible={isMenuOpen} onClose={handleCloseMenu} accentColor={colors.level2} />
    </>
  );
}