import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamFormatCard } from '@/components/teams/components/add-team-format-card.component';
import { useFormatPitcherCount } from '@/components/teams/hooks/use-format-pitcher-count.hook';
import { useFormats } from '@/components/teams/hooks/use-formats.hook';
import { FORMAT_DESCRIPTIONS, FORMAT_ORDER, getFormatAccentColor } from '@/components/teams/teams.constants';
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';

type AddTeamFormatStepProps = {
  formatId: string | null;
  formatName: string | null;
  onSelectFormat: (formatId: string, formatName: string) => void;
  onPitcherSlotCountChange: (count: number) => void;
};

export function AddTeamFormatStep({ formatId, formatName, onSelectFormat, onPitcherSlotCountChange }: AddTeamFormatStepProps) {
  const { colors, colorScheme } = useTheme();
  const { formats, loading } = useFormats();
  const pitcherCount = useFormatPitcherCount(formatId);

  useEffect(() => {
    if (formatId) {
      onPitcherSlotCountChange(pitcherCount);
    }
  }, [formatId, pitcherCount, onPitcherSlotCountChange]);

  const orderedFormats = useMemo(
    () => [...formats].sort((a, b) => FORMAT_ORDER.indexOf(a.name) - FORMAT_ORDER.indexOf(b.name)),
    [formats]
  );

  return (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
      {loading ? (
        <Text variant="muted">Loading formats...</Text>
      ) : (
        orderedFormats.map((format, index) => (
          <AnimatedCascadeItem key={format.id} index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={8}>
            <AddTeamFormatCard
              name={format.name}
              description={FORMAT_DESCRIPTIONS[format.name] ?? ''}
              accentColor={getFormatAccentColor(format.name, colors, colorScheme)}
              isSelected={format.id === formatId}
              onPress={() => onSelectFormat(format.id, format.name)}
            />
          </AnimatedCascadeItem>
        ))
      )}
    </ScrollView>
  );
}