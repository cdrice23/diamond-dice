import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Card } from '@/components/primitives/card.component';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { levelColor } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { TeamDetailPitcherSlot } from '../teams.types';

const AVATAR_WIDTH = 56;
const AVATAR_ASPECT_RATIO = 0.8;

type TeamDetailPitchersCardProps = {
  pitchers: TeamDetailPitcherSlot[];
  bandColor: string;
  textColor: string;
  accentColor?: string;
};

function PitcherRow({ slot, index }: { slot: TeamDetailPitcherSlot; index: number }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <AnimatedCascadeItem index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={6}>
      <Pressable
        onPress={() => router.push(`/player-database/${slot.player.id}`)}
        className="flex-row items-center gap-2.5 active:opacity-70"
      >
        <PlayerAvatar imageUrl={slot.player.image_url} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />

        <View className="flex-1 justify-center gap-1">
          <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
            {slot.player.name}
          </Text>
          <Chip label={`Lvl. ${slot.level ?? '--'}`} backgroundColor={levelColor(slot.level, colors)} shape="square" className="self-start" />
        </View>
      </Pressable>
    </AnimatedCascadeItem>
  );
}

export function TeamDetailPitchersCard({ pitchers, bandColor, textColor, accentColor }: TeamDetailPitchersCardProps) {
  if (pitchers.length === 0) {
    return null;
  }

  return (
    <Card className="mx-4">
      <TeamDetailCardHeader label="Pitchers" bandColor={bandColor} textColor={textColor} accentColor={accentColor} />

      <View className="gap-4">
        {pitchers.map((slot, index) => (
          <PitcherRow key={slot.player.id} slot={slot} index={index} />
        ))}
      </View>
    </Card>
  );
}