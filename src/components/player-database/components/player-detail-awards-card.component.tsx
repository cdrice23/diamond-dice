import type { PlayerAwardSummary } from '@/components/player-database/player-database.types';
import { getAwardTierColor } from '@/components/player-database/utils/get-award-tier-color';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';

type PlayerDetailAwardsCardProps = {
  awardSummaries: PlayerAwardSummary[];
};

export function PlayerDetailAwardsCard({ awardSummaries }: PlayerDetailAwardsCardProps) {
  const { colors } = useTheme();

  if (awardSummaries.length === 0) {
    return null;
  }

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Awards" />
      {awardSummaries.map((award, index) => (
        <View key={award.label} className={`py-3 ${index > 0 ? 'border-border border-t' : ''}`}>
          <View className="flex-row items-center gap-2 self-start">
            <Chip label={award.label} backgroundColor={getAwardTierColor(award.tier, colors)} shape="square" labelClassName="text-base" />
            {award.count > 1 && (
              <Text className="text-foreground text-base font-semibold">x{award.count}</Text>
            )}
          </View>
          <Text variant="muted" className="mt-2 text-base">
            {award.seasons.join(', ')}
          </Text>
        </View>
      ))}
    </Card>
  );
}