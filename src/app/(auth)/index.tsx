import { LogoSplash } from '@/components/branding/logo-splash';
import { supabase } from '@/utils/supabase';
import { THEME } from '@/utils/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

  async function handleAuth(mode: 'signUp' | 'signIn') {
    setError(null);

    if (mode === 'signUp' && !USERNAME_PATTERN.test(username)) {
      setError('Username must be 3–20 characters: letters, numbers, or underscores only.');
      return;
    }

    setLoading(true);

    const { error } = mode === 'signUp'
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace('/home');
  }

  return (
    <View style={styles.container}>
      <LogoSplash
        mainColor={colors.primary}
        accentColor={colors.level2}
        symbolSquareColor={colors.primary}
        symbolCubeColor={colors.primary}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Username (required to sign up)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={() => handleAuth('signIn')} disabled={loading}>
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>
      <Pressable style={styles.buttonSecondary} onPress={() => handleAuth('signUp')} disabled={loading}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  input: { fontFamily: 'VT323_400Regular', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, width: '100%' },
  button: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
  buttonSecondary: { backgroundColor: '#666', padding: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
  buttonText: { fontFamily: 'VT323_400Regular', color: '#fff' },
  error: { fontFamily: 'VT323_400Regular', color: 'red', textAlign: 'center' },
});