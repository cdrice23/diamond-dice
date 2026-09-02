import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { SearchableMultiSelectOption } from '../player-database.types';

type PlayerDatabaseMultiSelectModalProps = {
  visible: boolean;
  title: string;
  options: SearchableMultiSelectOption[];
  selectedIds: string[];
  onApply: (nextIds: string[]) => void;
  onDismiss: () => void;
  searchPlaceholder?: string;
};

export function PlayerDatabaseMultiSelectModal({
  visible,
  title,
  options,
  selectedIds,
  onApply,
  onDismiss,
  searchPlaceholder = 'Search...',
}: PlayerDatabaseMultiSelectModalProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [searchText, setSearchText] = useState('');

  const filteredOptions = useMemo(() => {
    if (searchText.trim() === '') return options;
    const normalized = searchText.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, searchText]);

  function handleOpenReset() {
    setDraft(selectedIds);
    setSearchText('');
  }

  function toggleOption(id: string) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleApply() {
    onApply(draft);
    onDismiss();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      onShow={handleOpenReset}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onDismiss} />
        <View className="bg-background rounded-t-2xl p-4 pb-10" style={{ height: '90%' }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-foreground text-lg font-bold">{title}</Text>
            <Pressable onPress={onDismiss} hitSlop={12} className="active:opacity-60">
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Input value={searchText} onChangeText={setSearchText} placeholder={searchPlaceholder} autoCorrect={false} />

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            className="mt-3"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = draft.includes(item.id);
              return (
                <Pressable
                  onPress={() => toggleOption(item.id)}
                  className="border-border flex-row items-center justify-between border-b py-3.5 active:opacity-60"
                >
                  <Text className="text-foreground text-base">{item.label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.level2} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text variant="muted" className="py-6 text-center text-sm">
                No matches
              </Text>
            }
          />

          <Pressable
            onPress={handleApply}
            className="mt-3 items-center rounded-sm py-3 active:opacity-70"
            style={{ backgroundColor: colors.level2 }}
          >
            <Text className="font-semibold text-white">
              Apply{draft.length > 0 ? ` (${draft.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}