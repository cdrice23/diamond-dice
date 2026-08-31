import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { Skeleton } from '@/components/primitives/skeleton.component';
import { useTheme } from '@/utils/theme-provider';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

type PlayerAvatarProps = {
  imageUrl: string | null | undefined;
  width?: number;
  aspectRatio?: number;
};

const DEFAULT_WIDTH = 64;
const DEFAULT_ASPECT_RATIO = 0.8;
const AVATAR_BORDER_RADIUS = 4;

export function PlayerAvatar({ imageUrl, width = DEFAULT_WIDTH, aspectRatio = DEFAULT_ASPECT_RATIO }: PlayerAvatarProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [imageUrl]);

  const height = width / aspectRatio;

  if (imageUrl && !failed) {
    return (
      <View style={{ width, height, borderRadius: AVATAR_BORDER_RADIUS, overflow: 'hidden' }}>
        {!loaded && <Skeleton className="rounded-none" style={{ position: 'absolute', width, height }} />}
        <Image
          key={imageUrl}
          source={{ uri: imageUrl }}
          contentFit="cover"
          cachePolicy="memory-disk"
          style={{ width, height, opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View className="bg-muted items-center justify-center" style={{ width, height, borderRadius: 12 }}>
      <PixelIcon name="player" size={width * 0.5} color={colors.mutedForeground} />
    </View>
  );
}