import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

const ICON_SIZE = 26;
const ICON_HIT_SLOP = 12;
const BADGE_SIZE = 10;

type FriendsHeaderProps = {
  hasPendingRequests: boolean;
  onMailboxPress: () => void;
  onAddFriendPress: () => void;
};

export function FriendsHeader({ hasPendingRequests, onMailboxPress, onAddFriendPress }: FriendsHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center justify-between px-4 pb-4 pt-20">
      <Text className="text-foreground text-3xl font-bold">Friends</Text>
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={onMailboxPress}
          hitSlop={ICON_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={hasPendingRequests ? 'Manage friend requests (new requests pending)' : 'Manage friend requests'}
          className="active:opacity-60"
        >
          <View>
            <MaterialCommunityIcons name="email-outline" size={ICON_SIZE} color={colors.foreground} />
            {hasPendingRequests && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: BADGE_SIZE,
                  height: BADGE_SIZE,
                  borderRadius: BADGE_SIZE / 2,
                  backgroundColor: colors.level2,
                  borderWidth: 1.5,
                  borderColor: colors.background,
                }}
              />
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={onAddFriendPress}
          hitSlop={ICON_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Add a friend"
          className="active:opacity-60"
        >
          <MaterialCommunityIcons name="account-plus-outline" size={ICON_SIZE} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}