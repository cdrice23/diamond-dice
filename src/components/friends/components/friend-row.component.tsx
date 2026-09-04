import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Pressable, View } from 'react-native';

type FriendRowProps = {
  username: string;
  displayName: string;
  isOnline: boolean;
  onPress: () => void;
};

export function FriendRow({ username, displayName, isOnline, onPress }: FriendRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-3 active:opacity-60">
      <View className="flex-1 pr-3">
        <Text className="text-foreground text-lg font-semibold">{displayName}</Text>
        <Text variant="muted" className="text-base">{`@${username}`}</Text>
      </View>
      {isOnline && (
        <View className="flex-row items-center gap-1.5">
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.level1 }} />
          <Text style={{ color: colors.level1 }} className="text-sm font-medium">
            Online
          </Text>
        </View>
      )}
    </Pressable>
  );
}