import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          options: { data: { username } }, // → auth.users.raw_user_meta_data, read by the trigger
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
      <Text style={styles.title}>Diamond Dice</Text>
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
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  button: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#666', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: 'red', textAlign: 'center' },
});