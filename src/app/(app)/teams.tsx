import { PlaceholderScreen } from '@/components/primitives/placeholder-screen.component';
import { useTheme } from '@/utils/theme-provider';

export default function TeamsScreen() {
  const { colors } = useTheme();
  return <PlaceholderScreen title="Teams" accentColor={colors.level2} />;
}