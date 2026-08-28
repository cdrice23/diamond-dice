import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { Skeleton } from '@/components/primitives/skeleton.component';
import type { TeamRosterPreviewPlayer } from '@/components/teams/teams.types';
import { useTheme } from '@/utils/theme-provider';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

const AVATAR_SIZE = 44;
const MAX_PREVIEW = 4;

type TeamsListCardRosterPreviewProps = {
  players: TeamRosterPreviewPlayer[];
};

function Avatar({ player }: { player: TeamRosterPreviewPlayer }) {
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState(!player.image_url);

  if (!player.image_url) {
    return (
      <View
        className="bg-muted items-center justify-center rounded-md"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      >
        <PixelIcon name="player" size={AVATAR_SIZE * 0.5} color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
      {!loaded && (
        <Skeleton className="bg-border absolute rounded-md" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} />
      )}
      <ExpoImage
        source={{ uri: player.image_url }}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 8, opacity: loaded ? 1 : 0 }}
      />
    </View>
  );
}

export function TeamsListCardRosterPreview({ players }: TeamsListCardRosterPreviewProps) {
  const shown = players.slice(0, MAX_PREVIEW);

  return (
    <View className="flex-row gap-2">
      {shown.map((player) => (
        <Avatar key={player.id} player={player} />
      ))}
    </View>
  );
}