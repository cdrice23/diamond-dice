import { Button } from '@/components/primitives/button.component';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSlideSelectMenu } from '../hooks/use-slide-select-menu.hook';
import { MenuItemButton } from './menu-item-button.component';

type MenuOverlayProps = {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
};

const MENU_ITEMS = [
  { label: 'Play', route: '/(app)/game-setup', iconName: 'baseball' },
  { label: 'Profile', route: '/(app)/profile', iconName: 'player' },
  { label: 'Teams', route: '/(app)/teams', iconName: 'jersey' },
  { label: 'Stats', route: '/(app)/stats', iconName: 'stats' },
  { label: 'Friends', route: '/(app)/friends', iconName: 'friends' },
  { label: 'Player Database', route: '/(app)/player-database', iconName: 'search' },
  { label: 'Sign Out', route: null, iconName: 'signOut' },
] as const;

export function MenuOverlay({ visible, onClose, accentColor }: MenuOverlayProps) {
  const { colors } = useTheme();

  async function handleSelect(index: number) {
    const item = MENU_ITEMS[index];
    onClose();
    if (item.route === null) {
      await supabase.auth.signOut();
    } else {
      router.push(item.route as never);
    }
  }

  const { gesture, activeIndex, reportBounds } = useSlideSelectMenu(MENU_ITEMS.length, handleSelect);

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: accentColor,
        zIndex: 100,
      }}
    >
      <GestureDetector gesture={gesture}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            paddingVertical: 40,
          }}
        >
          {MENU_ITEMS.map((item, index) => (
            <MenuItemButton
              key={item.label}
              label={item.label}
              iconName={item.iconName}
              index={index}
              activeIndex={activeIndex}
              primaryColor={colors.primary}
              backgroundColor={colors.background}
              onLayout={reportBounds}
            />
          ))}

          <Button variant="ghost" className="h-auto w-auto py-3" onPress={onClose} accessibilityLabel="Close menu">
            <Ionicons name="close" size={32} color={colors.foreground} />
          </Button>
        </View>
      </GestureDetector>
    </View>
  );
}