import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';

export default function FriendsScreen() {
  const { colors } = useTheme();
  return <PlaceholderScreen title="Friends" accentColor={colors.level1} />;
}