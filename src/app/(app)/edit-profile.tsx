import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { Button } from '@/components/primitives/button.component';
import { Input } from '@/components/primitives/input.component';
import { Switch } from '@/components/primitives/switch.component';
import { Text } from '@/components/primitives/text.component';
import { useCurrentProfile } from '@/hooks/use-current-profile.hook';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, loading } = useCurrentProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [autoRollEnabled, setAutoRollEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  async function handleSave() {
    if (!profile || !displayName.trim()) return;

    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', profile.id);
    setSaving(false);

    if (!error) {
      router.back();
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <View className="flex-1 px-4 pt-32">
        <Text className="text-foreground mb-8 text-3xl font-bold">Edit Profile</Text>

        <Text variant="muted" className="mb-2 text-lg">
          Display Name
        </Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          editable={!loading && !saving}
          className="h-14 text-xl"
          style={{ lineHeight: 20, textAlignVertical: 'center', paddingVertical: 0 }}
        />

        <View className="mt-8 flex-row items-center justify-between">
          <View>
            <Text className="text-foreground text-lg font-medium">Enable Auto-Roll</Text>
            <Text variant="muted" className="text-sm">
              Coming soon
            </Text>
          </View>
          <Switch value={autoRollEnabled} onValueChange={setAutoRollEnabled} disabled />
        </View>

        <Button className="mt-10" onPress={handleSave} disabled={saving || loading || !displayName.trim()}>
          <Text className="text-lg">{saving ? 'Saving...' : 'Save Profile'}</Text>
        </Button>
      </View>
    </View>
  );
}