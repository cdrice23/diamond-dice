import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { Button } from '@/components/primitives/button.component';
import { Text } from '@/components/primitives/text.component';
import { useSession } from '@/utils/session-provider';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function HomeScreen() {
  const { session } = useSession();
  const { colors } = useTheme()

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, status, created_at')
        .eq('id', session.user.id)
        .single();

      if (!error) {
        setMessage(`Signed in as ${data.username}, account status: ${data.status}`);
      }
      setLoading(false);
    }

    loadProfile();
  }, [session]);

  async function handleSignOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      console.error('Sign out failed:', error.message);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner size={80} color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text variant="h3">Signed in as {session?.user.email}</Text>
      <Text className="text-muted-foreground text-center italic">
        {message ?? 'No profile message found — check the table or RLS policy'}
      </Text>
      <Button className="bg-level2 w-full" onPress={handleSignOut} disabled={signingOut}>
        {signingOut ? (
          <LoadingSpinner size={20} color="#FFFFFF" blendColors={['#FFFFFF', '#FFFFFF', '#FFFFFF']} />
        ) : (
          <Text className="text-white">Sign Out</Text>
        )}
      </Button>
    </View>
  );
}