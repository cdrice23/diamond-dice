import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { FriendSearchResult } from '../hooks/use-friend-search.hook';

const ICON_SIZE = 24;

type FriendSearchResultRowProps = {
  username: string;
  displayName: string;
  relationshipStatus: FriendSearchResult['relationshipStatus'];
  onAddPress: () => void;
};

export function FriendSearchResultRow({ username, displayName, relationshipStatus, onAddPress }: FriendSearchResultRowProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-3">
        <Text className="text-foreground text-lg font-semibold">{displayName}</Text>
        <Text variant="muted" className="text-base">{`@${username}`}</Text>
      </View>

      {relationshipStatus === 'none' && (
        <Pressable
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel={`Add ${username} as a friend`}
          className="active:opacity-60"
        >
          <MaterialCommunityIcons name="account-plus-outline" size={ICON_SIZE} color={colors.level2} />
        </Pressable>
      )}
      {relationshipStatus === 'pending_sent' && (
        <Text variant="muted" className="text-base">Pending</Text>
      )}
      {relationshipStatus === 'pending_received' && (
        <Text variant="muted" className="text-base">Invited you</Text>
      )}
      {relationshipStatus === 'friends' && (
        <MaterialCommunityIcons name="check-circle-outline" size={ICON_SIZE} color={colors.level1} />
      )}
    </View>
  );
}