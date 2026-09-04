import { BottomSheetModal } from '@/components/primitives/bottom-sheet-modal.component';
import { Button } from '@/components/primitives/button.component';
import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type RequestGameModalProps = {
  visible: boolean;
  friendDisplayName: string | null;
  onDismiss: () => void;
};

export function RequestGameModal({ visible, friendDisplayName, onDismiss }: RequestGameModalProps) {
  return (
    <BottomSheetModal visible={visible} onDismiss={onDismiss}>
      <View className="bg-background gap-4 rounded-t-2xl p-5 pb-8">
        <Text className="text-foreground text-lg font-bold">
          {friendDisplayName ? `Play against ${friendDisplayName}?` : 'Request a Game'}
        </Text>
        <Text variant="muted" className="text-sm">
          Game invites are coming in a future update — check back once match setup is ready.
        </Text>
        <Button variant="outline" onPress={onDismiss}>
          <Text>Close</Text>
        </Button>
      </View>
    </BottomSheetModal>
  );
}