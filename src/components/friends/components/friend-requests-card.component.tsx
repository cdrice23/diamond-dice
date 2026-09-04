import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Pressable, View } from 'react-native';
import type { PendingRequestSummary } from '../friends.types';
import { FriendRequestRow } from './friend-request-row.component';

const PREVIEW_COUNT = 3;

type FriendRequestsCardProps = {
  requests: PendingRequestSummary[];
  totalCount: number;
  onAccept: (friendRequestId: string) => Promise<void>;
  onReject: (friendRequestId: string) => Promise<void>;
  onViewAllPress: () => void;
};

export function FriendRequestsCard({ requests, totalCount, onAccept, onReject, onViewAllPress }: FriendRequestsCardProps) {
  const { colors } = useTheme();
  const preview = requests.slice(0, PREVIEW_COUNT);

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Friend Requests" />

      <View>
        {preview.map((request, index) => (
          <View key={request.friendRequestId} style={index > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
            <FriendRequestRow
              username={request.username}
              displayName={request.displayName}
              onAccept={() => onAccept(request.friendRequestId)}
              onReject={() => onReject(request.friendRequestId)}
            />
          </View>
        ))}
      </View>

      <Pressable onPress={onViewAllPress} className="items-center pt-3 active:opacity-60">
        <Text style={{ color: colors.level2 }} className="text-base font-semibold">
          {`View All (${totalCount})`}
        </Text>
      </Pressable>
    </Card>
  );
}