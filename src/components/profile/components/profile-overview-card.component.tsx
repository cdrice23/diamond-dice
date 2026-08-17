import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import type { OverviewStats } from '@/components/profile/profile.types';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

type ProfileOverviewCardProps = {
  stats: OverviewStats;
};

function OverviewItem({
  label,
  value,
  onPress,
  valueColor,
}: {
  label: string;
  value: string;
  onPress: () => void;
  valueColor: string;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-2 active:opacity-70" accessibilityRole="button">
      <Text style={{ color: valueColor }} className="text-2xl font-bold">
        {value}
      </Text>
      <Text variant="muted">{label}</Text>
    </Pressable>
  );
}

export function ProfileOverviewCard({ stats }: ProfileOverviewCardProps) {
  const { colors } = useTheme();

  return (
    <Card className="mx-4">
      <View className="flex-row items-center">
        <OverviewItem
          label="Record"
          value={`${stats.wins}-${stats.losses}`}
          onPress={() => router.push('/(app)/stats')}
          valueColor={colors.level2}
        />
        <View className="bg-border h-10 w-px" />
        <OverviewItem
          label="Teams"
          value={String(stats.teamCount)}
          onPress={() => router.push('/(app)/teams')}
          valueColor={colors.level2}
        />
        <View className="bg-border h-10 w-px" />
        <OverviewItem
          label="Friends"
          value={String(stats.friendCount)}
          onPress={() => router.push('/(app)/friends')}
          valueColor={colors.level2}
        />
      </View>
    </Card>
  );
}