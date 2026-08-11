import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CornerNavButton } from './corner-nav-button.component';
import { HomePlateIcon } from './home-plate-icon.component';
import { MenuOverlay } from './menu-overlay.component';

const WHITE = '#F7F7F7';

export function PersistentNav() {
  const { colors, colorScheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [closeSignal, setCloseSignal] = useState(0);

  function handleCloseMenu() {
    setIsMenuOpen(false);
    setCloseSignal((n) => n + 1);
  }

  return (
    <>
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} pointerEvents="box-none">
      <CornerNavButton
        corner="left"
        fillColor={WHITE}
        activeFillColor={colors.level1}
        borderColor={colors.level1}
        label="Play"
        iconSize={36}
        onOpen={() => router.push('/(app)/game-setup')}
        closeSignal={0}
      >
        {(isActive) => <Ionicons name="add" size={36} color={isActive ? WHITE : colors.level1} />}
      </CornerNavButton>

      <CornerNavButton
        corner="right"
        fillColor={WHITE}
        activeFillColor={colors.level2}
        borderColor={colors.level2}
        label="Menu"
        iconSize={36}
        onOpen={() => setIsMenuOpen(true)}
        closeSignal={closeSignal}
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