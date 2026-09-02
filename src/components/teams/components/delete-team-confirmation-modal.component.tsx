import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';

type DeleteTeamConfirmationModalProps = {
  visible: boolean;
  teamName: string;
  deleting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteTeamConfirmationModal({
  visible,
  teamName,
  deleting,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteTeamConfirmationModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onCancel} />

        <View className="bg-background w-full max-w-sm gap-4 rounded-lg p-5">
          <View className="items-center gap-2">
            <MaterialCommunityIcons name="alert-circle-outline" size={36} color={colors.destructive} />
            <Text className="text-foreground text-center text-lg font-bold">Delete Team?</Text>
            <Text variant="muted" className="text-center text-sm">
              {`This will permanently delete "${teamName}" and its entire roster. This action cannot be undone.`}
            </Text>
          </View>

          {errorMessage && (
            <Text style={{ color: colors.destructive }} className="text-center text-sm font-medium">
              {errorMessage}
            </Text>
          )}

          <View className="gap-2">
            <Pressable
              onPress={onConfirm}
              disabled={deleting}
              className="items-center rounded-sm py-3 active:opacity-70"
              style={{ backgroundColor: deleting ? adjustHslAlpha(colors.destructive, 0.5) : colors.destructive }}
            >
              <Text className="text-base font-semibold text-white">{deleting ? 'Deleting...' : 'Delete Team'}</Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              disabled={deleting}
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