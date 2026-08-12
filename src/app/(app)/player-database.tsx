import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';

export default function PlayerDatabaseScreen() {
  const { colors } = useTheme();
  return <PlaceholderScreen title="Player Database" accentColor={colors.level2} />;
}