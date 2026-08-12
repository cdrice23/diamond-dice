import { Button } from '@/components/primitives/button.component';
import { Text } from '@/components/primitives/text.component';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

type MenuOverlayProps = {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
};

const MENU_ITEMS = [
  { label: 'Profile', route: '/(app)/profile' },
  { label: 'Teams', route: '/(app)/teams' },
  { label: 'Stats', route: '/(app)/stats' },
  { label: 'Friends', route: '/(app)/friends' },
  { label: 'Player Database', route: '/(app)/player-database' },
] as const;

export function MenuOverlay({ visible, onClose, accentColor }: MenuOverlayProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  function handleNavigate(route: string) {
    onClose();
    router.push(route as never);
  }

  async function handleSignOut() {
    onClose();
    await supabase.auth.signOut();
  }

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
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          paddingVertical: 40,
        }}
      >
        {MENU_ITEMS.map((item) => (
          <Button key={item.route} variant="ghost" className="h-auto py-3" onPress={() => handleNavigate(item.route)}>
            <Text style={{ fontSize: 32, lineHeight: 38, textTransform: 'uppercase' }}>{item.label}</Text>
          </Button>
        ))}

        <Button variant="ghost" className="h-auto py-3" onPress={handleSignOut}>
          <Text style={{ fontSize: 32, lineHeight: 38, textTransform: 'uppercase' }}>Sign Out</Text>
        </Button>

        <Button variant="ghost" className="h-auto w-auto py-3" onPress={onClose} accessibilityLabel="Close menu">
          <Ionicons name="close" size={48} color={colors.foreground} />
        </Button>
      </ScrollView>
    </View>
  );
}