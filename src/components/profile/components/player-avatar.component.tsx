// src/components/profile/components/player-avatar.component.tsx
import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { Image, View } from 'react-native';

type PlayerAvatarProps = {
  imageUrl: string | null | undefined;
  width?: number;
  aspectRatio?: number;
};

const DEFAULT_WIDTH = 64;
const DEFAULT_ASPECT_RATIO = 0.8;

export function PlayerAvatar({ imageUrl, width = DEFAULT_WIDTH, aspectRatio = DEFAULT_ASPECT_RATIO }: PlayerAvatarProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  const height = width / aspectRatio;

  if (imageUrl && !failed) {
    return (
      <View style={{ width, height, borderRadius: 4, overflow: 'hidden' }}>
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={{ width, height }}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View
      className="bg-muted items-center justify-center"
      style={{ width, height, borderRadius: 12 }}
    >
      <PixelIcon name="player" size={width * 0.5} color={colors.mutedForeground} />
    </View>
  );
}