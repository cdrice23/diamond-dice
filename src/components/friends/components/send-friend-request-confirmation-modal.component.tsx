import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

type SendFriendRequestConfirmationModalProps = {
  visible: boolean;
  displayName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function SendFriendRequestConfirmationModal({
  visible,
  displayName,
  onConfirm,
  onCancel,
}: SendFriendRequestConfirmationModalProps) {
  const { colors } = useTheme();
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    setSending(true);
    setErrorMessage(null);
    try {
      await onConfirm();
    } catch (error: any) {
      setErrorMessage(
        error?.code === '23505' ? 'A request already exists with this person.' : 'Something went wrong. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }

  function handleCancel() {
    setErrorMessage(null);
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleCancel} />

        <View className="bg-background w-full max-w-sm gap-4 rounded-lg p-5">
          <View className="items-center gap-2">
            <MaterialCommunityIcons name="account-plus-outline" size={36} color={colors.level2} />
            <Text className="text-foreground text-center text-lg font-bold">Send Friend Request?</Text>
            <Text variant="muted" className="text-center text-sm">
              {`Send a friend request to ${displayName}?`}
            </Text>
          </View>

          {errorMessage && (
            <Text style={{ color: colors.destructive }} className="text-center text-sm font-medium">
              {errorMessage}
            </Text>
          )}

          <View className="gap-2">
            <Pressable
              onPress={handleConfirm}
              disabled={sending}
              className="items-center rounded-sm py-3 active:opacity-70"
              style={{ backgroundColor: sending ? adjustHslAlpha(colors.level2, 0.5) : colors.level2 }}
            >
              <Text className="text-base font-semibold text-white">{sending ? 'Sending...' : 'Send Request'}</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              disabled={sending}
              className="items-center rounded-sm py-3 active:opacity-60"
              style={{ backgroundColor: colors.muted }}
            >
              <Text style={{ color: colors.mutedForeground }} className="text-base font-semibold">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}