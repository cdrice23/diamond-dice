import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';

export default function StatsScreen() {
  const { colors } = useTheme();
  return <PlaceholderScreen title="Stats" accentColor={colors.level3} />;
}