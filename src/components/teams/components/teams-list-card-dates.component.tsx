import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type TeamsListCardDatesProps = {
  updatedAt: string;
  lastPlayedAt: string | null;
};

const ROW_LINE_HEIGHT = 20;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(
    undefined,
    sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
  );
}

export function TeamsListCardDates({ updatedAt, lastPlayedAt }: TeamsListCardDatesProps) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="items-end">
        <Text variant="muted" className="text-right text-sm" style={{ lineHeight: ROW_LINE_HEIGHT }}>
          Updated
        </Text>
        <Text variant="muted" className="text-right text-sm" style={{ lineHeight: ROW_LINE_HEIGHT }}>
          Last played
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-foreground text-right text-base font-semibold" style={{ lineHeight: ROW_LINE_HEIGHT }}>
          {formatDate(updatedAt)}
        </Text>
        <Text className="text-foreground text-right text-base font-semibold" style={{ lineHeight: ROW_LINE_HEIGHT }}>
          {formatDate(lastPlayedAt)}
        </Text>
      </View>
    </View>
  );
}