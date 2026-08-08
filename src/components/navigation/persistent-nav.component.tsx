import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { CornerNavButton } from './corner-nav-button.component';
import { HomePlateIcon } from './home-plate-icon.component';

const WHITE = '#F7F7F7';

export function PersistentNav() {
  const { colors, colorScheme } = useTheme();

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} pointerEvents="box-none">
      <CornerNavButton
        corner="left"
        fillColor={WHITE}
        borderColor={colors.level1}
        label="Play"
        iconSize={36}
        onPress={() => router.push('/(app)/game-setup')}
      >
        <Ionicons name="add" size={36} color={colors.level1} />
      </CornerNavButton>

      <CornerNavButton
        corner="right"
        fillColor={WHITE}
        borderColor={colors.level2}
        label="Menu"
        iconSize={36}
        onPress={() => router.push('/(app)/menu')}
      >
        <Ionicons name="menu" size={36} color={colors.level2} />
      </CornerNavButton>

      <Pressable
        onPress={() => router.push('/(app)/home')}
        accessibilityRole="button"
        accessibilityLabel="Home"
        hitSlop={12}
        style={{
          position: 'absolute',
          bottom: 28,
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
            borderColor={colors.foreground}
          />
        )}
      </Pressable>
    </View>
  );
}