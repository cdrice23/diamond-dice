import { NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import type { Position } from '@/components/player-database/player-database.types';
import { POSITIONS } from '@/components/player-database/player-database.types';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { PlayerDatabaseFilterChipButton } from './player-database-filter-chip-button.component';

type PlayerDatabasePositionFilterButtonProps = {
  value: Position[];
  onChange: (next: Position[]) => void;
  disabled?: boolean;
};

export function PlayerDatabasePositionFilterButton({ value, onChange, disabled = false }: PlayerDatabasePositionFilterButtonProps) {
  const { colors, colorScheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Position[]>(value);

  const neutralColor = NEUTRAL_FILTER_COLOR[colorScheme];
  const neutralMuted = NEUTRAL_FILTER_COLOR_MUTED[colorScheme];
  const label = value.length === 0 ? 'Position' : value.join(', ');

  function handleOpen() {
    if (disabled) return;
    setDraft(value);
    setIsOpen(true);
  }

  function toggleDraftPosition(position: Position) {
    setDraft((prev) => (prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]));
  }

  function handleClear() {
    setDraft([]);
  }

  function arraysHaveSameMembers(a: Position[], b: Position[]): boolean {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every((item) => setB.has(item));
  }

  function handleDone() {
    if (!arraysHaveSameMembers(draft, value)) {
      onChange(draft);
    }
    setIsOpen(false);
  }

  function handleDismiss() {
    setIsOpen(false);
  }

  function selectedColorFor(position: Position): string {
    return position === 'P' ? colors.level1 : colors.level2;
  }

  return (
    <View className="flex-1">
      <PlayerDatabaseFilterChipButton
        label={label}
        isActive={value.length > 0}
        activeColor={neutralColor}
        onPress={handleOpen}
        accessibilityLabel={`Position filter, currently ${label}`}
        trailing={<Ionicons name="chevron-down" size={14} color={value.length > 0 ? '#F7F7F7' : neutralColor} />}
        inactiveBackgroundColor={neutralMuted}
        inactiveBorderColor={neutralMuted}
        disabled={disabled}
        fullWidth
      />

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleDismiss}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={handleDismiss}>
          <Pressable className="bg-background rounded-t-2xl p-4 pb-10" onPress={(e) => e.stopPropagation()}>
            <Text className="text-foreground mb-3 text-lg font-bold">Filter by Position</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {POSITIONS.map((position) => {
                const isSelected = draft.includes(position);
                const selectedColor = selectedColorFor(position);
                return (
                  <Pressable
                    key={position}
                    onPress={() => toggleDraftPosition(position)}
                    style={{ width: '23%' }}
                    className="aspect-square items-center justify-center rounded-lg"
                  >
                    <View
                      className="h-full w-full items-center justify-center rounded-lg"
                      style={{ backgroundColor: isSelected ? selectedColor : colors.muted }}
                    >
                      <Text style={{ color: isSelected ? '#F7F7F7' : colors.foreground }} className="text-xl font-bold">
                        {position}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleClear}
              className="mt-4 items-center rounded-sm py-2.5 active:opacity-60"
              style={{ backgroundColor: colors.muted }}
            >
              <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
                Clear Position Filters
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDone}
              className="mt-2 items-center rounded-sm py-3 active:opacity-70"
              style={{ backgroundColor: colors.level2 }}
            >
              <Text className="font-semibold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}