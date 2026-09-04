import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

function formatSentDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type SentRequestRowProps = {
  username: string;
  displayName: string;
  createdAt: string;
};

export function SentRequestRow({ username, displayName, createdAt }: SentRequestRowProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-3">
        <Text className="text-foreground text-lg font-semibold">{displayName}</Text>
        <Text variant="muted" className="text-base">{`@${username}`}</Text>
      </View>
      <Text variant="muted" className="text-base">{formatSentDate(createdAt)}</Text>
    </View>
  );
}