import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamColorPickerModal } from '@/components/teams/components/add-team-color-picker-modal.component';
import { AddTeamColorSplitCard } from '@/components/teams/components/add-team-color-split-card.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { adjustHslAlpha, areTeamColorsTooSimilar } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { areColorsExactlySame } from '../utils/team-theme-color';

type TeamCardTheme = {
  bandColor: string;
  textColor: string;
  accentColor?: string;
};

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
  cardTheme?: TeamCardTheme;
};

function Section({ label, cardTheme, children }: { label: string; cardTheme?: TeamCardTheme; children: ReactNode }) {
  if (!cardTheme) {
    return (
      <View>
        <CardSectionHeader label={label} />
        {children}
      </View>
    );
  }

  return (
    <Card className="mx-4 gap-1 py-5">
      <TeamDetailCardHeader label={label} bandColor={cardTheme.bandColor} textColor={cardTheme.textColor} accentColor={cardTheme.accentColor} />
      {children}
    </Card>
  );
}

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
  cardTheme,
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

  const isExactMatch = areColorsExactlySame(primaryColor, secondaryColor);
  const showSimilarColorsWarning =
    primaryColor !== null && secondaryColor !== null && areTeamColorsTooSimilar(primaryColor, secondaryColor);

  const outerClassName = cardTheme ? 'flex-1 justify-center gap-4' : 'flex-1 justify-center items-between gap-8 px-4';

  const teamNameAndFieldSection = (
    <>
      <View className="gap-1">
        {cardTheme ? (
          <Text className="text-foreground text-xl font-bold">Team Name</Text>
        ) : (
          <CardSectionHeader label="Team Name" />
        )}
        <Input value={teamName} onChangeText={onTeamNameChange} placeholder="e.g. Riverside Ramblers" maxLength={30} error={!!fieldErrors.team_name} />
        {fieldErrors.team_name && <Text className="text-destructive text-sm">{fieldErrors.team_name}</Text>}
      </View>

      <View className="gap-1">
        {cardTheme ? (
          <Text className="text-foreground text-xl font-bold">Home Field</Text>
        ) : (
          <CardSectionHeader label="Home Field" />
        )}
        <Input
          value={homeFieldName}
          onChangeText={onHomeFieldNameChange}
          placeholder="e.g. Elm Street Diamond"
          maxLength={30}
          error={!!fieldErrors.home_field_name}
        />
        {fieldErrors.home_field_name && <Text className="text-destructive text-sm">{fieldErrors.home_field_name}</Text>}
      </View>
    </>
  );

  return (
    <View className={outerClassName}>
      {cardTheme ? (
        <>
          <Section label="Team Details" cardTheme={cardTheme}>
            <View className="gap-4">{teamNameAndFieldSection}</View>
          </Section>
        </>
      ) : (
        teamNameAndFieldSection
      )}

      <Section label="Team Colors" cardTheme={cardTheme}>
        <AddTeamColorSplitCard
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onPressPrimary={() => openColorPicker('primary')}
          onPressSecondary={() => openColorPicker('secondary')}
        />
        {showSimilarColorsWarning && (
          <View
            className="mt-2 flex-row items-start gap-2 rounded-md p-2.5"
            style={{
              backgroundColor: isExactMatch ? adjustHslAlpha(colors.destructive, 0.1) : adjustHslAlpha(colors.level2, 0.1),
            }}
          >
            <MaterialCommunityIcons
              name={isExactMatch ? 'alert-outline' : 'alert-circle-outline'}
              size={16}
              color={isExactMatch ? colors.destructive : colors.mutedForeground}
              style={{ marginTop: 2 }}
            />
            <Text
              className="flex-1 text-sm"
              style={{ color: isExactMatch ? colors.destructive : undefined }}
              variant={isExactMatch ? undefined : 'muted'}
            >
              {isExactMatch
                ? 'These colors are identical. Choose two different colors to save your team.'
                : 'These colors are hard to tell apart. Your team will work fine, but you may want to consider team colors with more contrast.'}
            </Text>
          </View>
        )}
      </Section>

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