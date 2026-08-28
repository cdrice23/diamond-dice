import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { useTheme } from '@/utils/theme-provider';
import { Image as ExpoImage } from 'expo-image';
import { useState } from "react";
import { View } from 'react-native';

const AVATAR_SIZE = 44;

type TeamDetailPlayerAvatarProps = {
  imageUrl: string | null;
};

export function TeamDetailPlayerAvatar({ imageUrl }: TeamDetailPlayerAvatarProps) {
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState(!imageUrl);

  if (!imageUrl) {
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
      <ExpoImage
        source={{ uri: imageUrl }}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 8, opacity: loaded ? 1 : 0 }}
      />
    </View>
  );
}