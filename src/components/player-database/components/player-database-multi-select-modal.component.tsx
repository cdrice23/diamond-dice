import { BottomSheetModal } from '@/components/primitives/bottom-sheet-modal.component';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
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
  const wasVisibleRef = useRef(visible);

  if (visible && !wasVisibleRef.current) {
    setDraft(selectedIds);
    setSearchText('');
  }
  wasVisibleRef.current = visible;

  const filteredOptions = useMemo(() => {
    if (searchText.trim() === '') return options;
    const normalized = searchText.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, searchText]);

  function toggleOption(id: string) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleApply() {
    onApply(draft);
    onDismiss();
  }

  return (
    <BottomSheetModal visible={visible} onDismiss={onDismiss} contentStyle={{ height: '90%' }}>
      <View className="bg-background rounded-t-2xl pt-4 pb-10" style={{ flex: 1 }}>
        <View className="mb-3 flex-row items-center justify-between px-4">
          <Text className="text-foreground text-2xl font-bold">{title}</Text>
          <Pressable onPress={onDismiss} hitSlop={12} className="active:opacity-60">
            <Ionicons name="close" size={24} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View className="px-4">
          <Input value={searchText} onChangeText={setSearchText} placeholder={searchPlaceholder} autoCorrect={false} />
        </View>

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
                style={{
                  backgroundColor: isSelected ? adjustHslAlpha(colors.level2, 0.14) : 'transparent',
                  paddingLeft: 16,
                  paddingRight: 24,
                }}
              >
                <Text className="text-foreground text-lg" style={isSelected ? { color: colors.level2, fontWeight: '600' } : undefined}>
                  {item.label}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.level2} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text variant="muted" className="py-6 text-center text-sm">
              No matches
            </Text>
          }
        />

        <View className="px-4">
          <Pressable
            onPress={handleApply}
            className="mt-3 items-center rounded-sm py-3 active:opacity-70"
            style={{ backgroundColor: colors.level2 }}
          >
            <Text className="text-lg font-semibold" style={{ color: '#F7F7F7' }}>
              Apply{draft.length > 0 ? ` (${draft.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}