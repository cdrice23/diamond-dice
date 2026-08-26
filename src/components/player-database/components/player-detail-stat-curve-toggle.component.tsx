import type { StatCurveConfig } from '@/components/player-database/utils/stat-curve-config';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Pressable, ScrollView } from 'react-native';

type PlayerDetailStatCurveToggleProps = {
  configs: StatCurveConfig[];
  activeKey: string;
  onSelect: (key: string) => void;
};

export function PlayerDetailStatCurveToggle({ configs, activeKey, onSelect }: PlayerDetailStatCurveToggleProps) {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-1">
      {configs.map((config) => {
        const isActive = config.key === activeKey;
        return (
          <Pressable
            key={config.key}
            onPress={() => onSelect(config.key)}
            className="rounded-md px-3 py-1.5 active:opacity-70"
            style={{ backgroundColor: isActive ? colors.primary : colors.muted }}
            accessibilityRole="button"
            accessibilityLabel={`Show ${config.label} distribution`}
          >
            <Text className="text-sm font-semibold" style={{ color: isActive ? colors.background : colors.mutedForeground }}>
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}