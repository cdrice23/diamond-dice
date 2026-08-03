import { RESET_CODE_LENGTH } from '@/components/auth/auth.constants';
import { AnimatedSlotContainer } from '@/components/auth/components/animated-slot-container.component';
import { AnimatedSlot } from '@/components/auth/components/animated-slot.component';
import { PasswordInput } from '@/components/auth/components/password-input.component';
import { useAuthForm } from '@/components/auth/hooks/use-auth-form.hook';
import { useFormStep } from '@/components/auth/hooks/use-form-step.hook';
import { useStepTransition } from '@/components/auth/hooks/use-step-transition.hook';
import { FieldKey, FormStep, STEPS } from '@/components/auth/steps.config';
import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { LogoSplash } from '@/components/branding/components/logo-splash.component';
import { Button } from '@/components/primitives/button.component';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { supabase } from '@/utils/supabase';
import { THEME } from '@/utils/theme';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, useColorScheme, View } from 'react-native';

type Step = FormStep | 'checkEmail';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('initial');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const formStep = useFormStep(step);
  const form = useAuthForm(formStep);

  const prevStepRef = useRef<FormStep>('initial');
  const slots = useStepTransition(prevStepRef.current, formStep, STEPS[formStep]);

  useEffect(() => {
    prevStepRef.current = formStep;
  }, [formStep]);

  function slotProps(key: FieldKey) {
    return {
      position: slots[key].position,
      visible: slots[key].visible,
      moveDelay: slots[key].moveDelay,
      fadeDelay: slots[key].fadeDelay,
    };
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function handleSignUp() {
    setError(null);
    form.setFieldErrors({});
    if (!form.isSignUpValid) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setStep('checkEmail');
  }

  function handlePrimaryActionPress() {
    if (formStep === 'initial') {
      setStep('loginForm');
    } else if (formStep === 'loginForm') {
      handleLogin();
    } else if (formStep === 'signUpForm') {
      handleSignUp();
    }
  }

  function handleSecondaryActionPress() {
    if (formStep === 'initial') {
      setStep('signUpForm');
    }
  }

  function handleForgotPasswordPress() {
    setStep('forgotPasswordForm');
  }

  async function handleResetActionPress() {
    setError(null);
    if (formStep === 'forgotPasswordForm') {
      setLoading(true);
      const ok = await form.sendResetCode();
      setLoading(false);
      if (ok) setStep('codeEntryForm');
    } else if (formStep === 'resetPasswordForm') {
      setLoading(true);
      await form.submitNewPassword(() => setStep('loginForm'));
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setLoading(true);
    await form.sendResetCode();
    setLoading(false);
  }

  function handleResetCodeChange(value: string) {
    form.handleResetCodeChange(value);
    if (value.length === RESET_CODE_LENGTH) {
      form.verifyResetCode(value, () => setStep('resetPasswordForm'));
    }
  }

  function handleBackPress() {
    setError(null);
    if (formStep === 'forgotPasswordForm') {
      setStep('loginForm');
    } else if (formStep === 'codeEntryForm') {
      setStep('forgotPasswordForm');
    } else {
      setStep('initial');
      form.reset();
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} className="bg-background">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
          <LogoSplash mainColor={colors.primary} accentColor={colors.level2} symbolSquareColor={colors.level2} symbolCubeColor={colors.primary} />

          {step === 'checkEmail' ? (
            <View className="items-center gap-4">
              <Text className="font-body text-foreground text-center">Check your email to confirm your account.</Text>
              <Text className="font-body text-muted-foreground text-center text-sm">
                Already have an account? Try resetting your password instead.
              </Text>
              <Button variant="ghost" onPress={() => setStep('initial')}>
                <Text>Back to Login</Text>
              </Button>
            </View>
          ) : (
            <AnimatedSlotContainer>
              <AnimatedSlot {...slotProps('email')} errorText={form.fieldErrors.email}>
                <Input
                  placeholder={formStep === 'signUpForm' ? 'Email' : 'Username or Email'}
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.email}
                  value={form.email}
                  onChangeText={form.handleEmailChange}
                  onBlur={() => form.checkEmailFormat(form.email)}
                  autoCapitalize="none"
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('username')} errorText={form.fieldErrors.username}>
                <Input
                  placeholder="Username"
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.username}
                  value={form.username}
                  onChangeText={form.handleUsernameChange}
                  onBlur={() => form.checkUsernameAvailability(form.username)}
                  autoCapitalize="none"
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('password')} errorText={form.fieldErrors.password}>
                <PasswordInput
                  placeholder="Password"
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.password}
                  iconColor={colors.primary}
                  value={form.password}
                  onChangeText={form.handlePasswordChange}
                  onBlur={form.checkPasswordsMatch}
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('confirmPassword')} errorText={form.fieldErrors.confirmPassword}>
                <PasswordInput
                  placeholder="Confirm Password"
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.confirmPassword}
                  iconColor={colors.primary}
                  value={form.confirmPassword}
                  onChangeText={form.handleConfirmPasswordChange}
                  onBlur={form.checkPasswordsMatch}
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('resetCode')} errorText={form.fieldErrors.resetCode}>
                <Input
                  placeholder="Reset Code"
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.resetCode}
                  value={form.resetCode}
                  onChangeText={handleResetCodeChange}
                  keyboardType="number-pad"
                  maxLength={RESET_CODE_LENGTH}
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('newPassword')} errorText={form.fieldErrors.newPassword}>
                <PasswordInput
                  placeholder="New Password"
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.newPassword}
                  iconColor={colors.primary}
                  value={form.newPassword}
                  onChangeText={form.handleNewPasswordChange}
                  onBlur={form.checkNewPasswordsMatch}
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('confirmNewPassword')} errorText={form.fieldErrors.confirmNewPassword}>
                <PasswordInput
                  placeholder="Confirm New Password"
                  className="border-primary text-primary"
                  error={!!form.fieldErrors.confirmNewPassword}
                  iconColor={colors.primary}
                  value={form.confirmNewPassword}
                  onChangeText={form.handleConfirmNewPasswordChange}
                  onBlur={form.checkNewPasswordsMatch}
                />
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('primaryAction')}>
                <Button
                  className="bg-level2"
                  onPress={handlePrimaryActionPress}
                  disabled={loading || (formStep === 'loginForm' ? !form.isLoginValid : formStep === 'signUpForm' ? !form.isSignUpValid : false)}
                >
                  <Text className="text-primary">{formStep === 'signUpForm' ? 'Sign Up' : 'Login'}</Text>
                </Button>
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('secondaryAction')}>
                <Button className="bg-level1" onPress={handleSecondaryActionPress} disabled={loading}>
                  <Text className="text-primary">Sign Up</Text>
                </Button>
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('forgotPassword')}>
                <Button variant="link" onPress={handleForgotPasswordPress}>
                  <Text>Forgot Password?</Text>
                </Button>
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('resetAction')}>
                <Button
                  className="bg-level2"
                  onPress={handleResetActionPress}
                  disabled={loading || (formStep === 'resetPasswordForm' ? !form.isResetPasswordValid : form.email.trim().length === 0)}
                >
                  {loading ? (
                    <LoadingSpinner size={20} color={colors.primary} blendColors={[colors.primary, colors.primary, colors.primary]} />
                  ) : (
                    <Text>{formStep === 'resetPasswordForm' ? 'Set New Password' : 'Get Confirmation Code'}</Text>
                  )}
                </Button>
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('resendCode')}>
                <Button variant="link" onPress={handleResendCode} disabled={loading}>
                  <Text>Resend Confirmation Email</Text>
                </Button>
              </AnimatedSlot>

              <AnimatedSlot {...slotProps('back')}>
                <Button variant="ghost" onPress={handleBackPress}>
                  <Text>Back</Text>
                </Button>
              </AnimatedSlot>
            </AnimatedSlotContainer>
          )}

          {error && <Text style={{ color: colors.destructive }}>{error}</Text>}
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  );
}