import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import type { PlayerDetail, PlayerTeamHistoryRow } from '@/components/player-database/hooks/use-player-detail.hook';
import type { PlayerAwardSummary } from '@/components/player-database/player-database.types';
import { getAwardTierColor } from '@/components/player-database/utils/get-award-tier-color';
import { Chip } from '@/components/primitives/chip.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Image, View } from 'react-native';

type PlayerDetailHeaderProps = {
  player: PlayerDetail;
  teamHistory: PlayerTeamHistoryRow[];
  awardSummaries: PlayerAwardSummary[];
};

const IMAGE_WIDTH = 128;
const IMAGE_ASPECT_RATIO = 0.8;
const TEAM_SUMMARY_LIMIT = 2;

function resolveEffectiveRoles(player: PlayerDetail) {
  const isEffectivePitcher = player.eligible_positions.includes('P') && player.is_qualified_pitcher;
  const isEffectiveBatter =
    player.eligible_positions.some((position) => position !== 'P') && player.is_qualified_batter;

  return { isEffectiveBatter, isEffectivePitcher, isTwoWay: isEffectiveBatter && isEffectivePitcher };
}

function levelColor(level: number | null, colors: ReturnType<typeof useTheme>['colors']): string {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

function buildTeamSummary(teamHistory: PlayerTeamHistoryRow[]): string {
  if (teamHistory.length === 0) return '—';

  const totalYearsByTeam = new Map<string, number>();
  for (const stint of teamHistory) {
    const years = stint.end_year - stint.start_year + 1;
    totalYearsByTeam.set(stint.team_name, (totalYearsByTeam.get(stint.team_name) ?? 0) + years);
  }

  const ranked = Array.from(totalYearsByTeam.entries()).sort((a, b) => b[1] - a[1]);

  const shown = ranked.slice(0, TEAM_SUMMARY_LIMIT).map(([teamName]) => teamName);
  const remaining = ranked.length - TEAM_SUMMARY_LIMIT;

  return remaining > 0 ? `${shown.join(', ')} +${remaining} more` : shown.join(', ');
}

export function PlayerDetailHeader({ player, teamHistory, awardSummaries }: PlayerDetailHeaderProps) {
  const { colors } = useTheme();
  const { isEffectiveBatter, isEffectivePitcher, isTwoWay } = resolveEffectiveRoles(player);
  const imageHeight = IMAGE_WIDTH / IMAGE_ASPECT_RATIO;

  return (
    <View className="gap-3 px-4">
      <View className="flex-row gap-4">
        {player.image_url ? (
          <Image
            source={{ uri: player.image_url }}
            resizeMode="cover"
            style={{ width: IMAGE_WIDTH, height: imageHeight, borderRadius: 14 }}
          />
        ) : (
          <View
            className="bg-muted items-center justify-center"
            style={{ width: IMAGE_WIDTH, height: imageHeight, borderRadius: 14 }}
          >
            <PixelIcon name="player" size={IMAGE_WIDTH * 0.5} color={colors.mutedForeground} />
          </View>
        )}

        <View className="flex-1">
          <Text className="text-foreground text-3xl font-bold mb-2" numberOfLines={1}>
            {player.name}
          </Text>

          <View className="flex-row flex-wrap items-center gap-4 mb-2">
            {isTwoWay ? (
              <>
                <View className="flex-row items-center gap-2">
                  <PixelIcon name="bat" size={18} color={colors.primary} />
                  <Chip label={`Lvl. ${player.batting_rating_level ?? '--'}`} backgroundColor={levelColor(player.batting_rating_level, colors)} shape="square" />
                </View>
                <View className="flex-row items-center gap-2">
                  <PixelIcon name="baseball" size={18} color={colors.primary} />
                  <Chip label={`Lvl. ${player.pitching_rating_level ?? '--'}`} backgroundColor={levelColor(player.pitching_rating_level, colors)} shape="square" />
                </View>
              </>
            ) : isEffectiveBatter ? (
              <View className="flex-row items-center gap-2">
                <PixelIcon name="bat" size={18} color={colors.primary} />
                <Chip label={`Lvl. ${player.batting_rating_level ?? '--'}`} backgroundColor={levelColor(player.batting_rating_level, colors)} shape="square" />
              </View>
            ) : isEffectivePitcher ? (
              <View className="flex-row items-center gap-2">
                <PixelIcon name="baseball" size={18} color={colors.primary} />
                <Chip label={`Lvl. ${player.pitching_rating_level ?? '--'}`} backgroundColor={levelColor(player.pitching_rating_level, colors)} shape="square" />
              </View>
            ) : null}
          </View>

          <Text variant="muted" className="text-xl mb-2">
            {player.eligible_positions.length > 0 ? player.eligible_positions.join('/') : '—'}
          </Text>

          <View className="flex-row gap-4">
            <Text variant="muted" className="text-lg">
              Bats: <Text className="text-foreground text-lg">{player.bats?.toUpperCase() ?? '—'}</Text>
            </Text>
            <Text variant="muted" className="text-lg">
              Throws: <Text className="text-foreground text-lg">{player.throws?.toUpperCase() ?? '—'}</Text>
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text variant="muted" className="text-lg">
          Teams -{' '}
          <Text className="text-foreground text-lg font-semibold">{buildTeamSummary(teamHistory)}</Text>
        </Text>
      </View>

      {awardSummaries.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {awardSummaries.map((award) => (
            <Chip
              key={award.label}
              label={award.count > 1 ? `${award.label} x${award.count}` : award.label}
              backgroundColor={getAwardTierColor(award.tier, colors)}
              shape="square"
            />
          ))}
        </View>
      )}
    </View>
  );
}