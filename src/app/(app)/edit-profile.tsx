import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { Button } from '@/components/primitives/button.component';
import { Input } from '@/components/primitives/input.component';
import { Switch } from '@/components/primitives/switch.component';
import { Text } from '@/components/primitives/text.component';
import { updateCachedProfile, useCurrentProfile } from '@/hooks/use-current-profile.hook';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

type UpdateProfileErrorBody = {
  error?: { code: string; field?: string; message: string };
};

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, loading } = useCurrentProfile();
  const { pastThreshold } = usePitchState();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [autoRollEnabled, setAutoRollEnabled] = useState(profile?.autoRollEnabled ?? false);
  const [initialValues, setInitialValues] = useState<{ displayName: string; autoRollEnabled: boolean } | null>(
    profile ? { displayName: profile.displayName, autoRollEnabled: profile.autoRollEnabled } : null
  );
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (profile && !initialValues) {
    setDisplayName(profile.displayName);
    setAutoRollEnabled(profile.autoRollEnabled);
    setInitialValues({ displayName: profile.displayName, autoRollEnabled: profile.autoRollEnabled });
  }

  const hasChanges =
    !!initialValues &&
    (displayName.trim() !== initialValues.displayName || autoRollEnabled !== initialValues.autoRollEnabled);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  function handleDisplayNameChange(value: string) {
    setDisplayName(value);
    if (displayNameError) {
      setDisplayNameError(null);
    }
  }

  async function handleSave() {
    if (!profile || !displayName.trim()) return;

    setSaving(true);
    setDisplayNameError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke('update-profile', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: {
        display_name: displayName.trim(),
        auto_roll_enabled: autoRollEnabled,
      },
    });

    setSaving(false);

    if (error) {
      let parsed: UpdateProfileErrorBody | null = null;
      try {
        parsed = await error.context?.json();
      } catch {
        parsed = null;
      }

      if (parsed?.error?.field === 'display_name') {
        setDisplayNameError(parsed.error.message);
      } else {
        setDisplayNameError(parsed?.error?.message ?? 'Something went wrong saving your profile.');
      }
      return;
    }

    if (data?.profile) {
      updateCachedProfile({
        id: data.profile.id,
        username: data.profile.username,
        displayName: data.profile.display_name,
        autoRollEnabled: data.profile.auto_roll_enabled,
      });
    }

    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <View className="flex-1 px-4 pt-28">
          <Text className="text-foreground mb-8 text-3xl font-bold">Edit Profile</Text>

          <Text variant="muted" className="mb-2 text-lg">
            Display Name
          </Text>
          <Input
            value={displayName}
            onChangeText={handleDisplayNameChange}
            placeholder="Display name"
            editable={!loading && !saving}
            error={!!displayNameError}
            className="h-14 text-xl"
            style={{ lineHeight: 20, textAlignVertical: 'center', paddingVertical: 0 }}
          />
          {displayNameError && (
            <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>
              {displayNameError}
            </Text>
          )}

          <View className="mt-8 flex-row items-center justify-between">
            <View>
              <Text className="text-foreground text-lg font-medium">Enable Auto-Roll</Text>
            </View>
            <Switch value={autoRollEnabled} onValueChange={setAutoRollEnabled} disabled={loading || saving} />
          </View>

          <Button className="mt-10 bg-level2" onPress={handleSave} disabled={saving || loading || !displayName.trim() || !hasChanges}>
            <Text className="text-lg">{saving ? 'Saving...' : 'Save Profile'}</Text>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}