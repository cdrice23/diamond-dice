import { BottomSheetModal } from '@/components/primitives/bottom-sheet-modal.component';
import { Text } from '@/components/primitives/text.component';
import { useFormats } from '@/components/teams/hooks/use-formats.hook';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

type TeamsFormatFilterModalProps = {
  visible: boolean;
  selectedFormatId: string | null;
  onSelect: (formatId: string | null, formatName: string | null) => void;
  onDismiss: () => void;
};

export function TeamsFormatFilterModal({ visible, selectedFormatId, onSelect, onDismiss }: TeamsFormatFilterModalProps) {
  const { colors } = useTheme();
  const { formats, loading } = useFormats();

  return (
    <BottomSheetModal visible={visible} onDismiss={onDismiss}>
      <Pressable className="bg-background rounded-t-2xl p-4 pb-10" onPress={(e) => e.stopPropagation()}>
        <Text className="text-foreground mb-3 text-lg font-bold">Filter by Format</Text>

        {loading ? (
          <Text variant="muted">Loading formats...</Text>
        ) : (
          <View>
            <Pressable
              onPress={() => onSelect(null, null)}
              className="border-border flex-row items-center justify-between border-b py-3.5 active:opacity-60"
            >
              <Text className="text-foreground text-base">Any Format</Text>
              {selectedFormatId === null && <Ionicons name="checkmark-circle" size={22} color={colors.level2} />}
            </Pressable>

            {formats.map((format) => (
              <Pressable
                key={format.id}
                onPress={() => onSelect(format.id, format.name)}
                className="border-border flex-row items-center justify-between border-b py-3.5 active:opacity-60"
              >
                <Text className="text-foreground text-base">{format.name}</Text>
                {selectedFormatId === format.id && <Ionicons name="checkmark-circle" size={22} color={colors.level2} />}
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>
    </BottomSheetModal>
  );
}