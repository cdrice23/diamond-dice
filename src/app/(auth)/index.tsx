import { AnimatedSlotContainer } from '@/components/auth/animated-slot-container.component';
import { AnimatedSlot } from '@/components/auth/animated-slot.component';
import { STEPS } from '@/components/auth/steps.config';
import { useStepTransition } from '@/components/auth/use-step-transition.hook';
import { LogoSplash } from '@/components/branding/logo-splash.component';
import { Button } from '@/components/primitives/button.component';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { supabase } from '@/utils/supabase';
import { THEME } from '@/utils/theme';
import { useEffect, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';

type Step = 'initial' | 'loginForm';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('initial');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const prevStepRef = useRef<Step>('initial');
  const slots = useStepTransition(prevStepRef.current, step, STEPS[step]);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

  useEffect(() => {
    prevStepRef.current = step;
  }, [step]);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    }
  }

  function handlePrimaryActionPress() {
    if (step === 'initial') {
      setStep('loginForm');
    } else {
      handleLogin();
    }
  }

  function handleBack() {
    setStep('initial');
    setError(null);
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }} className="bg-background">
      <LogoSplash mainColor={colors.primary} accentColor={colors.level2} symbolSquareColor={colors.level2} symbolCubeColor={colors.primary} />

      <AnimatedSlotContainer>
        <AnimatedSlot position={slots.identifier.position} visible={slots.identifier.visible} moveDelay={slots.identifier.moveDelay} fadeDelay={slots.identifier.fadeDelay}>
          <Input placeholder="Email or Username" className="border-primary text-primary" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
        </AnimatedSlot>

        <AnimatedSlot position={slots.password.position} visible={slots.password.visible} moveDelay={slots.password.moveDelay} fadeDelay={slots.password.fadeDelay}>
          <Input placeholder="Password" className="border-primary text-primary" value={password} onChangeText={setPassword} secureTextEntry />
        </AnimatedSlot>

        <AnimatedSlot position={slots.primaryAction.position} visible={slots.primaryAction.visible} moveDelay={slots.primaryAction.moveDelay} fadeDelay={slots.primaryAction.fadeDelay}>
          <Button variant="secondary" className="bg-level2" onPress={handlePrimaryActionPress} disabled={loading}>
            <Text>Login</Text>
          </Button>
        </AnimatedSlot>

        <AnimatedSlot position={slots.secondaryAction.position} visible={slots.secondaryAction.visible} moveDelay={slots.secondaryAction.moveDelay} fadeDelay={slots.secondaryAction.fadeDelay}>
          <Button variant="secondary" className="bg-level1" onPress={() => {}}>
            <Text>Sign Up</Text>
          </Button>
        </AnimatedSlot>

        <AnimatedSlot position={slots.forgotPassword.position} visible={slots.forgotPassword.visible} moveDelay={slots.forgotPassword.moveDelay} fadeDelay={slots.forgotPassword.fadeDelay}>
          <Button variant="link" onPress={() => {}}>
            <Text>Forgot Password?</Text>
          </Button>
        </AnimatedSlot>

        <AnimatedSlot position={slots.back.position} visible={slots.back.visible} moveDelay={slots.back.moveDelay} fadeDelay={slots.back.fadeDelay}>
          <Button variant="ghost" onPress={handleBack}>
            <Text>Back</Text>
          </Button>
        </AnimatedSlot>
      </AnimatedSlotContainer>

      {error && <Text style={{ color: colors.destructive }}>{error}</Text>}
    </View>
  );
}