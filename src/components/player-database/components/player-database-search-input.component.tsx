import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { Input } from '@/components/primitives/input.component';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback.hook';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { View } from 'react-native';

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_ICON_SIZE = 18;

type PlayerDatabaseSearchInputProps = {
  onSearchTermChange: (term: string) => void;
};

export function PlayerDatabaseSearchInput({ onSearchTermChange }: PlayerDatabaseSearchInputProps) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');

  const debouncedOnChange = useDebouncedCallback(onSearchTermChange, SEARCH_DEBOUNCE_MS);

  function handleChangeText(text: string) {
    setValue(text);
    debouncedOnChange(text);
  }

  return (
    <View className="px-4 pb-2">
      <View className="relative justify-center">
        <View className="absolute left-3 z-10" style={{ height: SEARCH_ICON_SIZE }}>
          <PixelIcon name="search" size={SEARCH_ICON_SIZE} color={colors.mutedForeground} />
        </View>
        <Input
          value={value}
          onChangeText={handleChangeText}
          placeholder="Search Player Name"
          accessibilityLabel="Search player name"
          className="pl-10"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
    </View>
  );
}