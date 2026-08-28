import { Text } from '@/components/primitives/text.component';
import { TeamsListCardHeader } from '@/components/teams/components/teams-list-card-header.component';
import { TeamsListCardRosterPreview } from '@/components/teams/components/teams-list-card-roster-preview.component';
import type { TeamSummary } from '@/components/teams/teams.types';
import { Pressable, View } from 'react-native';
import { TeamsListCardDates } from './teams-list-card-dates.component';
import { TeamsListCardFormatChip } from './teams-list-format-chip.component';

type TeamsListCardProps = {
  team: TeamSummary;
  onPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
};

export function TeamsListCard({ team, onPress, onEditPress, onDeletePress }: TeamsListCardProps) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="bg-card border-border mb-3 overflow-hidden rounded-lg border shadow-sm shadow-black/5">
        <TeamsListCardHeader
          teamName={team.team_name}
          primaryColor={team.team_theme_color_primary}
          secondaryColor={team.team_theme_color_secondary}
          onEditPress={onEditPress}
          onDeletePress={onDeletePress}
        />

        <View className="flex-row gap-3 p-4">
          <View className="flex-1 justify-start">
            <TeamsListCardRosterPreview players={team.roster_preview} />
          </View>

          <View className="w-32 items-center justify-center">
            <Text variant="muted" className="text-center text-sm">
              Diamond{'\n'}(next pass)
            </Text>
          </View>
        </View>

        <View className="border-border flex-row items-center justify-between border-t px-4 py-2">
          <TeamsListCardFormatChip formatName={team.format_name} />
          <TeamsListCardDates updatedAt={team.updated_at} lastPlayedAt={team.last_played_at} />
        </View>
      </View>
    </Pressable>
  );
}