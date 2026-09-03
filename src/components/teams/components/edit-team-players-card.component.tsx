import { Card } from '@/components/primitives/card.component';
import { ErrorBanner } from '@/components/primitives/error-banner.component';
import { Text } from '@/components/primitives/text.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { TeamDetailPitchersCard } from '@/components/teams/components/team-detail-pitchers-card.component';
import { TeamDetailPositionPlayersCard } from '@/components/teams/components/team-detail-position-players-card.component';
import { type TeamDetailViewMode } from '@/components/teams/components/team-detail-view-toggle.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { TeamDetailPitcherSlot, TeamDetailPositionSlot } from '../teams.types';

type EditTeamPlayersCardProps = {
  positionPlayers: TeamDetailPositionSlot[];
  pitchers: TeamDetailPitcherSlot[];
  bandColor: string;
  textColor: string;
  accentColor?: string;
  rosterErrorMessage?: string | null;
  onEditPlayers: () => void;
  onEditBattingOrder: () => void;
};

export function EditTeamPlayersCard({
  positionPlayers,
  pitchers,
  bandColor,
  textColor,
  accentColor,
  rosterErrorMessage,
  onEditPlayers,
  onEditBattingOrder,
}: EditTeamPlayersCardProps) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<TeamDetailViewMode>('list');

  return (
    <Card className="mx-4">
      <TeamDetailCardHeader
        label="Players"
        bandColor={bandColor}
        textColor={textColor}
        accentColor={accentColor}
        action={
          <View>
            <Pressable onPress={() => setMenuOpen((prev) => !prev)} accessibilityLabel="Players options" accessibilityRole="button" hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={22} color={textColor} />
            </Pressable>

            {menuOpen && (
              <>
                <Pressable
                  style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000 }}
                  onPress={() => setMenuOpen(false)}
                />
                <View className="bg-popover border-border absolute right-0 top-8 z-10 w-44 rounded-sm border py-1 shadow-sm shadow-black/10">
                  <Pressable
                    onPress={() => {
                      setMenuOpen(false);
                      onEditPlayers();
                    }}
                    className="active:bg-accent px-3 py-2.5"
                  >
                    <Text className="text-popover-foreground text-base">Edit Players</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setMenuOpen(false);
                      onEditBattingOrder();
                    }}
                    className="active:bg-accent px-3 py-2.5"
                  >
                    <Text className="text-popover-foreground text-base">Edit Batting Order</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        }
      />

      {rosterErrorMessage && (
        <View className="mb-4">
          <ErrorBanner message={rosterErrorMessage} />
        </View>
      )}

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-xl font-bold">Position Players</Text>
        </View>
        <TeamDetailPositionPlayersCard
          positionPlayers={positionPlayers}
          pitchers={pitchers}
          bandColor={bandColor}
          textColor={textColor}
          accentColor={accentColor}
          hideCardWrapper
          hideViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </View>

      <View className="mt-6 gap-2">
        <Text className="text-foreground text-xl font-bold">Pitchers</Text>
        <TeamDetailPitchersCard pitchers={pitchers} bandColor={bandColor} textColor={textColor} accentColor={accentColor} hideCardWrapper />
      </View>
    </Card>
  );
}