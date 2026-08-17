// src/app/(app)/edit-profile.tsx
import { Button } from '@/components/primitives/button.component';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { useCurrentProfile } from '@/hooks/use-current-profile.hook';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

export default function EditProfileScreen() {
  const { profile, loading } = useCurrentProfile();
  const [displayName, setDisplayName] = useState('');
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
    <View className="bg-background flex-1 px-4 pt-4">
      <Text className="text-foreground mb-6 text-2xl font-bold">Edit Profile</Text>

      <Text variant="muted" className="mb-1">
        Display Name
      </Text>
      <Input value={displayName} onChangeText={setDisplayName} placeholder="Display name" editable={!loading && !saving} />

      <View className="mt-6 flex-row items-center justify-between">
        <View>
          <Text className="text-foreground text-base font-medium">Enable Auto-Roll</Text>
          <Text variant="muted" className="text-xs">
            Coming soon
          </Text>
        </View>
        <Switch value={autoRollEnabled} onValueChange={setAutoRollEnabled} disabled />
      </View>

      <Button className="mt-8" onPress={handleSave} disabled={saving || loading || !displayName.trim()}>
        <Text>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </Button>
    </View>
  );
}