import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';

export default function ProfileScreen() {
  const { colors } = useTheme();
  return <PlaceholderScreen title="Profile" accentColor={colors.level1} />;
}