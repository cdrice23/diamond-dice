import { BottomSheetModal } from '@/components/primitives/bottom-sheet-modal.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import ColorPicker, { HueSlider, Panel1, Preview } from 'reanimated-color-picker';

const DEFAULT_SWATCHES = [
  '#D42836', '#AE1F28',
  '#EF5D21', '#FF7A00',
  '#F5B61B', '#FFD500',
  '#16A34A', '#A3E635', '#013831',
  '#3FC2CC', '#025D5D', '#41748D',
  '#00A3E0', '#86B7E1', '#134D91', '#273B81',
  '#37246B', '#C084FC',
  '#EC4899',
  '#C19D56', '#8B6F4E', '#E5D6AE',
  '#B3BCC0', '#FFF6DD', '#000000', '#FFFFFF',
];

const MAX_CUSTOM_SWATCHES = 5;
const SWATCH_SIZE = 32;

type AddTeamColorPickerModalProps = {
  visible: boolean;
  selectedColor: string | null;
  customSwatches: string[];
  onAddCustomSwatch: (hex: string) => void;
  onUpdateCustomSwatch: (index: number, hex: string) => void;
  onSelect: (color: string) => void;
  onDismiss: () => void;
};

type EditTarget = { index: number | null };

export function AddTeamColorPickerModal({
  visible,
  selectedColor,
  customSwatches,
  onAddCustomSwatch,
  onUpdateCustomSwatch,
  onSelect,
  onDismiss,
}: AddTeamColorPickerModalProps) {
  const { colors, colorScheme } = useTheme();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [pendingHex, setPendingHex] = useState('#C2410C');
  const [pickerSeed, setPickerSeed] = useState('#C2410C');
  const wasVisibleRef = useRef(visible);

  if (visible && !wasVisibleRef.current) {
    setEditTarget(null);
  }
  wasVisibleRef.current = visible;

  function handleClose() {
    setEditTarget(null);
    onDismiss();
  }

  function handleSelectDefault(hex: string) {
    onSelect(hex);
    handleClose();
  }

  function openAddNew() {
    setPendingHex('#C2410C');
    setPickerSeed('#C2410C');
    setEditTarget({ index: null });
  }

  function openEditExisting(index: number) {
    setPendingHex(customSwatches[index]);
    setPickerSeed(customSwatches[index]);
    setEditTarget({ index });
  }

  function handleConfirmPicker() {
    if (editTarget?.index != null) {
      onUpdateCustomSwatch(editTarget.index, pendingHex);
    } else {
      onAddCustomSwatch(pendingHex);
    }
    onSelect(pendingHex);
    setEditTarget(null);
    onDismiss();
  }

  const canAddMore = customSwatches.length < MAX_CUSTOM_SWATCHES;
  const addButtonColor = colorScheme === 'dark' ? colors.primary : colors.mutedForeground;

  return (
    <BottomSheetModal visible={visible} onDismiss={handleClose}>
      <Pressable className="bg-background gap-6 rounded-t-2xl p-4 pb-16" onPress={(e) => e.stopPropagation()}>
        {editTarget === null ? (
          <>
            <Text className="text-foreground text-xl font-bold">Choose a Color</Text>

            <View className="gap-3">
              <Text variant="muted" className="text-base font-semibold uppercase">
                Default Colors
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {DEFAULT_SWATCHES.map((hex) => {
                  const isSelected = hex.toLowerCase() === selectedColor?.toLowerCase();
                  return (
                    <Pressable key={hex} onPress={() => handleSelectDefault(hex)} className="active:opacity-70">
                      <View
                        className="items-center justify-center rounded-full border-2"
                        style={{
                          width: SWATCH_SIZE,
                          height: SWATCH_SIZE,
                          backgroundColor: hex,
                          borderColor: colors.primary,
                        }}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#F7F7F7" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-3">
              <Text variant="muted" className="text-base font-semibold uppercase">
                Custom Colors
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {customSwatches.map((hex, index) => {
                  const isSelected = hex.toLowerCase() === selectedColor?.toLowerCase();
                  return (
                    <Pressable key={`${hex}-${index}`} onPress={() => openEditExisting(index)} className="active:opacity-70">
                      <View
                        className="items-center justify-center rounded-full border-2"
                        style={{
                          width: SWATCH_SIZE,
                          height: SWATCH_SIZE,
                          backgroundColor: hex,
                          borderColor: colors.primary,
                        }}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                      </View>
                    </Pressable>
                  );
                })}

                <Pressable onPress={openAddNew} disabled={!canAddMore} className="active:opacity-70">
                  <View
                    className="items-center justify-center rounded-full border-2 border-dashed"
                    style={{
                      width: SWATCH_SIZE,
                      height: SWATCH_SIZE,
                      borderColor: addButtonColor,
                      opacity: canAddMore ? 1 : 0.4,
                    }}
                  >
                    <Ionicons name="add" size={18} color={addButtonColor} />
                  </View>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              <Pressable onPress={() => setEditTarget(null)} hitSlop={8} className="active:opacity-60">
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </Pressable>
              <Text className="text-foreground text-xl font-bold">
                {editTarget.index != null ? 'Edit Custom Color' : 'Choose a Custom Color'}
              </Text>
            </View>

            <ColorPicker value={pickerSeed} onChangeJS={(result) => setPendingHex(result.hex)}>
              <Preview />
              <Panel1 style={{ borderRadius: 12 }} />
              <HueSlider style={{ borderRadius: 12 }} />
            </ColorPicker>

            <Pressable
              onPress={handleConfirmPicker}
              className="items-center rounded-sm py-3 active:opacity-70"
              style={{ backgroundColor: colors.level2 }}
            >
              <Text className="text-base font-semibold" style={{ color: '#F7F7F7' }}>
                Confirm
              </Text>
            </Pressable>
          </>
        )}
      </Pressable>
    </BottomSheetModal>
  );
}