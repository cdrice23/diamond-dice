import { TeamDiamondPositions } from '@/components/teams/components/team-diamond-positions.component';
import { TeamsListCardBattingOrderGutter } from '@/components/teams/components/teams-list-card-batting-order-gutter.component';
import { TeamsListCardDates } from '@/components/teams/components/teams-list-card-dates.component';
import { TeamsListCardHeader } from '@/components/teams/components/teams-list-card-header.component';
import { TeamsListCardRosterPreview } from '@/components/teams/components/teams-list-card-roster-preview.component';
import type { TeamSummary } from '@/components/teams/teams.types';
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { TeamsListCardFormatChip } from './teams-list-format-chip.component';

type TeamsListCardProps = {
  team: TeamSummary;
  onPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
};

const GUTTER_GAP = 12;

export function TeamsListCard({ team, onPress, onEditPress, onDeletePress }: TeamsListCardProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const [gutterWidth, setGutterWidth] = useState(0);

  function handleRowLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== rowWidth) {
      setRowWidth(width);
    }
  }

  function handleGutterLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== gutterWidth) {
      setGutterWidth(width);
    }
  }

  const diamondWidth = rowWidth > 0 && gutterWidth > 0 ? rowWidth - gutterWidth - GUTTER_GAP : 0;

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

        <View className="p-4">
          <View className="flex-row items-center mb-5" style={{ gap: GUTTER_GAP }} onLayout={handleRowLayout}>
            <View onLayout={handleGutterLayout}>
              <TeamsListCardBattingOrderGutter battingOrder={team.batting_order} />
            </View>
            {diamondWidth > 0 && (
              <TeamDiamondPositions
                positions={team.position_levels}
                pitcherLevels={team.pitcher_levels}
                width={diamondWidth}
              />
            )}
          </View>
          <TeamsListCardRosterPreview players={team.roster_preview} />
        </View>

        <View className="border-border flex-row items-center justify-between border-t px-4 py-2">
          <TeamsListCardFormatChip formatName={team.format_name} />
          <TeamsListCardDates updatedAt={team.updated_at} lastPlayedAt={team.last_played_at} />
        </View>
      </View>
    </Pressable>
  );
}