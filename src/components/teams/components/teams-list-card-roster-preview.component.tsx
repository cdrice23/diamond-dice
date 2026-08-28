import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { Skeleton } from '@/components/primitives/skeleton.component';
import type { TeamRosterPreviewPlayer } from '@/components/teams/teams.types';
import { useTheme } from '@/utils/theme-provider';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

const AVATAR_SIZE = 40;
const MIN_AVATAR_GAP = 8;

type TeamsListCardRosterPreviewProps = {
  players: TeamRosterPreviewPlayer[];
};

function Avatar({ player, marginRight }: { player: TeamRosterPreviewPlayer; marginRight: number }) {
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState(!player.image_url);

  const wrapperStyle = { width: AVATAR_SIZE, height: AVATAR_SIZE, marginRight };

  if (!player.image_url) {
    return (
      <View className="bg-muted items-center justify-center rounded-md" style={wrapperStyle}>
        <PixelIcon name="player" size={AVATAR_SIZE * 0.5} color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View style={wrapperStyle}>
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
  const [rowWidth, setRowWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== rowWidth) {
      setRowWidth(width);
    }
  }

  if (rowWidth === 0) {
    return <View onLayout={handleLayout} />;
  }

  const maxCount = Math.max(1, Math.floor((rowWidth + MIN_AVATAR_GAP) / (AVATAR_SIZE + MIN_AVATAR_GAP)));
  const shown = players.slice(0, maxCount);

  const gap = shown.length > 1 ? (rowWidth - shown.length * AVATAR_SIZE) / (shown.length - 1) : 0;

  return (
    <View className="flex-row" onLayout={handleLayout}>
      {shown.map((player, i) => (
        <Avatar key={player.id} player={player} marginRight={i === shown.length - 1 ? 0 : gap} />
      ))}
    </View>
  );
}