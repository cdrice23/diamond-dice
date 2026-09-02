import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamFormatCard } from '@/components/teams/components/add-team-format-card.component';
import { useFormatPitcherCounts } from '@/components/teams/hooks/use-format-pitcher-counts.hook';
import { useFormats } from '@/components/teams/hooks/use-formats.hook';
import { Platform, ScrollView, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AddTeamFormatStepProps = {
  formatId: string | null;
  formatName: string | null;
  onSelectFormat: (formatId: string, formatName: string, pitcherCount: number) => void;
};

export function AddTeamFormatStep({ formatId, formatName, onSelectFormat }: AddTeamFormatStepProps) {
  const { formats, loading } = useFormats();
  const { counts: pitcherCounts } = useFormatPitcherCounts();

  return (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
      {loading ? (
        <Text variant="muted">Loading formats...</Text>
      ) : (
        formats.map((format, index) => (
          <AnimatedCascadeItem key={format.id} index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={8}>
            <AddTeamFormatCard
              name={format.name}
              description={format.description ?? ''}
              isSelected={format.id === formatId}
              onPress={() => onSelectFormat(format.id, format.name, pitcherCounts[format.id] ?? 0)}
            />
          </AnimatedCascadeItem>
        ))
      )}
    </ScrollView>
  );
}