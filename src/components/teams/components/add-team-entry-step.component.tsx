import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

type AddTeamEntryStepProps = {
  onChoosePath: (path: 'scratch' | 'random') => void;
  onCancel: () => void;
};

const PRESSED_TINT_OPACITY = 0.12;

function EntryOption({
  icon,
  title,
  description,
  accentColor,
  onPress,
  index,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
  onPress: () => void;
  index: number;
}) {
  return (
    <AnimatedCascadeItem index={index} staggerDelayMs={120} fadeDurationMs={400} translateYStart={16}>
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View
            className="gap-3 rounded-lg border-2 p-6"
            style={{
              borderColor: accentColor,
              backgroundColor: pressed ? adjustHslAlpha(accentColor, PRESSED_TINT_OPACITY) : 'transparent',
            }}
          >
            <MaterialCommunityIcons name={icon} size={36} color={accentColor} />
            <Text style={{ color: accentColor }} className="text-2xl font-bold">
              {title}
            </Text>
            <Text variant="muted" className="text-lg">
              {description}
            </Text>
          </View>
        )}
      </Pressable>
    </AnimatedCascadeItem>
  );
}

export function AddTeamEntryStep({ onChoosePath, onCancel }: AddTeamEntryStepProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1 justify-center gap-4 px-4">
      <EntryOption
        icon="account-multiple-plus"
        title="Build from Scratch"
        description="You're the manager: craft your roster using the searchable player database"
        accentColor={colors.level1}
        onPress={() => onChoosePath('scratch')}
        index={0}
      />
      <EntryOption
        icon="creation-outline"
        title="Generate a Random Team"
        description="Choose a format and optional filters to generate a team to build off of"
        accentColor={colors.level2}
        onPress={() => onChoosePath('random')}
        index={1}
      />

      <Pressable onPress={onCancel} className="mt-2 items-center rounded-sm py-2.5 active:opacity-60" style={{ backgroundColor: colors.muted }}>
        <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}