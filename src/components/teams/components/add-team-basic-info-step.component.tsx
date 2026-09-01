import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamColorPickerModal } from '@/components/teams/components/add-team-color-picker-modal.component';
import { AddTeamColorSwatch } from '@/components/teams/components/add-team-color-swatch.component';
import { areTeamColorsTooSimilar } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, View } from 'react-native';

type AddTeamBasicInfoStepProps = {
  teamName: string;
  homeFieldName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  customColorSwatches: string[];
  fieldErrors: { team_name?: string; home_field_name?: string };
  onTeamNameChange: (value: string) => void;
  onHomeFieldNameChange: (value: string) => void;
  onPrimaryColorChange: (value: string) => void;
  onSecondaryColorChange: (value: string) => void;
  onAddCustomSwatch: (hex: string) => void;
  onUpdateCustomSwatch: (index: number, hex: string) => void;
};

export function AddTeamBasicInfoStep({
  teamName,
  homeFieldName,
  primaryColor,
  secondaryColor,
  customColorSwatches,
  fieldErrors,
  onTeamNameChange,
  onHomeFieldNameChange,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onAddCustomSwatch,
  onUpdateCustomSwatch,
}: AddTeamBasicInfoStepProps) {
  const { colors } = useTheme();
  const [activeSwatch, setActiveSwatch] = useState<'primary' | 'secondary' | null>(null);

  function handleSelectColor(color: string) {
    if (activeSwatch === 'primary') onPrimaryColorChange(color);
    if (activeSwatch === 'secondary') onSecondaryColorChange(color);
    setActiveSwatch(null);
  }

  function openColorPicker(target: 'primary' | 'secondary') {
    Keyboard.dismiss();
    setActiveSwatch(target);
  }

  const showSimilarColorsWarning =
    primaryColor !== null && secondaryColor !== null && areTeamColorsTooSimilar(primaryColor, secondaryColor);

  return (
    <View className="flex-1 gap-6 px-4">
      <View className="gap-2">
        <Text className="text-foreground text-base font-semibold">Team Name</Text>
        <Input value={teamName} onChangeText={onTeamNameChange} placeholder="e.g. Riverside Ramblers" maxLength={30} error={!!fieldErrors.team_name} />
        {fieldErrors.team_name && <Text className="text-destructive text-sm">{fieldErrors.team_name}</Text>}
      </View>

      <View className="gap-2">
        <Text className="text-foreground text-base font-semibold">Home Field</Text>
        <Input
          value={homeFieldName}
          onChangeText={onHomeFieldNameChange}
          placeholder="e.g. Elm Street Diamond"
          maxLength={30}
          error={!!fieldErrors.home_field_name}
        />
        {fieldErrors.home_field_name && <Text className="text-destructive text-sm">{fieldErrors.home_field_name}</Text>}
      </View>

      <View className="gap-2">
        <Text className="text-foreground text-base font-semibold">Team Colors</Text>
        <View className="flex-row">
          <AddTeamColorSwatch label="Primary" color={primaryColor} onPress={() => openColorPicker('primary')} />
          <AddTeamColorSwatch label="Secondary" color={secondaryColor} onPress={() => openColorPicker('secondary')} />
        </View>

        {showSimilarColorsWarning && (
          <View className="flex-row items-start gap-2 pt-1">
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <Text variant="muted" className="flex-1 text-sm">
              These colors are hard to tell apart. Your team will still work fine, but a bit more contrast can help it stand out.
            </Text>
          </View>
        )}
      </View>

      <AddTeamColorPickerModal
        visible={activeSwatch !== null}
        selectedColor={activeSwatch === 'primary' ? primaryColor : secondaryColor}
        customSwatches={customColorSwatches}
        onAddCustomSwatch={onAddCustomSwatch}
        onUpdateCustomSwatch={onUpdateCustomSwatch}
        onSelect={handleSelectColor}
        onDismiss={() => setActiveSwatch(null)}
      />
    </View>
  );
}