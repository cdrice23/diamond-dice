import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { RosterPitcherRow } from '@/components/teams/components/roster-pitcher-row.component';
import { RosterPositionRow } from '@/components/teams/components/roster-position-row.component';
import { RosterSlotsFormatBadge } from '@/components/teams/components/roster-slots-format-badge.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import type { WizardPitcherSlot, WizardPositionSlot } from '../teams.types';

type AddTeamRandomReviewStepProps = {
  formatName: string | null;
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
  loading: boolean;
  showSpamWarning: boolean;
};

function noop() {}

function SpamWarningBanner() {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row gap-2.5 rounded-md p-3"
      style={{ backgroundColor: adjustHslAlpha(colors.level2, 0.12), borderWidth: 1, borderColor: adjustHslAlpha(colors.level2, 0.35) }}
    >
      <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.level2} />
      <Text style={{ color: colors.level2 }} className="flex-1 text-sm font-medium">
        Looks like you are having trouble finding the team you want — remember you can edit each slot on the next step, or go back and
        set different filters on the previous step.
      </Text>
    </View>
  );
}

export function AddTeamRandomReviewStep({
  formatName,
  positionSlots,
  pitcherSlots,
  loading,
  showSpamWarning,
}: AddTeamRandomReviewStepProps) {
  return (
    <>
      {formatName && (
        <View className="px-4 pb-3">
          <RosterSlotsFormatBadge formatName={formatName} />
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <LoadingSpinner size={80} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
          {showSpamWarning && <SpamWarningBanner />}

          <Card>
            <CardSectionHeader label="Position Players" />
            <View className="gap-4">
              {positionSlots.map((slot, index) => (
                <AnimatedCascadeItem key={`${slot.position}-${index}`} index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={6}>
                  <RosterPositionRow slot={slot} onPress={noop} />
                </AnimatedCascadeItem>
              ))}
            </View>
          </Card>

          <Card>
            <CardSectionHeader label="Pitchers" />
            <View className="gap-4">
              {pitcherSlots.map((slot, index) => (
                <AnimatedCascadeItem key={index} index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={6}>
                  <RosterPitcherRow slot={slot} onPress={noop} />
                </AnimatedCascadeItem>
              ))}
            </View>
          </Card>
        </ScrollView>
      )}
    </>
  );
}

type RegenerateHeaderButtonProps = {
  regenerating: boolean;
  onPress: () => void;
};

export function RegenerateHeaderButton({ regenerating, onPress }: RegenerateHeaderButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={regenerating}
      className="flex-row items-center gap-1.5 rounded-md px-3 py-2"
      style={{ backgroundColor: colors.muted, opacity: regenerating ? 0.5 : 1 }}
    >
      <MaterialCommunityIcons name="dice-multiple-outline" size={16} color={colors.foreground} />
      <Text className="text-foreground text-sm font-semibold">{regenerating ? 'Generating...' : 'Regenerate'}</Text>
    </Pressable>
  );
}