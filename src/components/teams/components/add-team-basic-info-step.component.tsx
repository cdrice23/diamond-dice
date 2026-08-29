import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamColorPickerModal } from '@/components/teams/components/add-team-color-picker-modal.component';
import { AddTeamColorSwatch } from '@/components/teams/components/add-team-color-swatch.component';
import { useState } from 'react';
import { View } from 'react-native';

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
  const [activeSwatch, setActiveSwatch] = useState<'primary' | 'secondary' | null>(null);

  function handleSelectColor(color: string) {
    if (activeSwatch === 'primary') onPrimaryColorChange(color);
    if (activeSwatch === 'secondary') onSecondaryColorChange(color);
    setActiveSwatch(null);
  }

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
          <AddTeamColorSwatch label="Primary" color={primaryColor} onPress={() => setActiveSwatch('primary')} />
          <AddTeamColorSwatch label="Secondary" color={secondaryColor} onPress={() => setActiveSwatch('secondary')} />
        </View>
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