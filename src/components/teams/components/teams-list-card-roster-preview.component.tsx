import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { PlayerAvatar } from '@/components/profile/components/player-avatar.component';
import type { TeamRosterPreviewPlayer } from '@/components/teams/teams.types';
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

const AVATAR_WIDTH = 40;
const AVATAR_ASPECT_RATIO = 0.8;
const MIN_AVATAR_GAP = 8;

type TeamsListCardRosterPreviewProps = {
  players: TeamRosterPreviewPlayer[];
};

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

  const maxCount = Math.max(1, Math.floor((rowWidth + MIN_AVATAR_GAP) / (AVATAR_WIDTH + MIN_AVATAR_GAP)));
  const shown = players.slice(0, maxCount);
  const gap = shown.length > 1 ? (rowWidth - shown.length * AVATAR_WIDTH) / (shown.length - 1) : 0;

  return (
    <View className="flex-row" onLayout={handleLayout}>
      {shown.map((player, i) => (
        <AnimatedCascadeItem
          key={player.id}
          index={i}
          staggerDelayMs={55}
          fadeDurationMs={400}
          translateYStart={0}
          style={{ marginRight: i === shown.length - 1 ? 0 : gap }}
        >
          <PlayerAvatar imageUrl={player.image_url} width={AVATAR_WIDTH} aspectRatio={AVATAR_ASPECT_RATIO} />
        </AnimatedCascadeItem>
      ))}
    </View>
  );
}