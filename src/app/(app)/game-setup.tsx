import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';

export default function GameSetupScreen() {
  const { colors } = useTheme();
  return <PlaceholderScreen title="Game Setup" accentColor={colors.level1} />;
}