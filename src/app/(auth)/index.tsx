import { getAuthErrorInfo, getFunctionErrorInfo } from '@/components/auth/auth-errors';
import { RESET_CODE_LENGTH, SLOT_HEIGHT } from '@/components/auth/auth.constants';
import { AnimatedSlotContainer } from '@/components/auth/components/animated-slot-container.component';
import { AnimatedSlot } from '@/components/auth/components/animated-slot.component';
import { AuthBackground } from '@/components/auth/components/auth-background.component';
import { AuthBlend } from '@/components/auth/components/auth-blend.component';
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
import { useTheme } from '@/utils/theme-provider';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  useWindowDimensions,
  View
} from 'react-native';

type Step = FormStep | 'checkEmail';

const CONTAINER_PADDING = 24;
const CONTAINER_GAP = 24;
const SOLID_HEIGHT_BUFFER = -60;
const SOLID_TOP_BUFFER = -20;

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('initial');
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<{ label: string; onPress: () => void } | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [containerLayout, setContainerLayout] = useState({ y: 0, height: 0 });
  const [logoHeight, setLogoHeight] = useState(0);

  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

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

  function handleContainerLayout(e: LayoutChangeEvent) {
    const { y, height } = e.nativeEvent.layout;
    setContainerLayout({ y, height });
  }

  function handleLogoLayout(e: LayoutChangeEvent) {
    const measured = e.nativeEvent.layout.height;
    if (measured !== logoHeight) {
      setLogoHeight(measured);
    }
  }

  async function handleLogin() {
    setError(null);
    setErrorAction(null);
    setShowResendConfirmation(false);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('login-with-identifier', {
        body: { identifier: form.loginIdentifier, password: form.password },
      });

      if (error) {
        let info = getAuthErrorInfo(error);
        const context = (error as { context?: Response }).context;
        if (context) {
          const body = await context.json();
          info = getFunctionErrorInfo(body);
        }

        setError(info.message);
        if (info.code === 'email_not_confirmed' || info.code === 'email_not_confirmed_for_username') {
          setShowResendConfirmation(true);
        }
        return;
      }

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
    } catch (err) {
      const info = getAuthErrorInfo(err);
      setError(info.message);
      if (info.isNetworkError) {
        setErrorAction({ label: 'Retry', onPress: handleLogin });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    setErrorAction(null);
    setShowResendConfirmation(false);
    form.setFieldErrors({});
    if (!form.isSignUpValid) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { username: form.username } },
      });

      if (error) {
        const info = getAuthErrorInfo(error);
        if (info.code === 'weak_password') {
          form.setFieldErrors((prev) => ({ ...prev, password: info.message }));
        } else {
          setError(info.message);
        }
        return;
      }
      setStep('checkEmail');
    } catch (err) {
      const info = getAuthErrorInfo(err);
      setError(info.message);
      if (info.isNetworkError) {
        setErrorAction({ label: 'Retry', onPress: handleSignUp });
      }
    } finally {
      setLoading(false);
    }
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
    setErrorAction(null);
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

  async function handleResendConfirmation() {
    const ok = await form.resendConfirmationEmail(form.loginIdentifier);
    if (ok) {
      setError('Confirmation email sent.');
      setShowResendConfirmation(false);
    }
  }

  function handleResetCodeChange(value: string) {
    form.handleResetCodeChange(value);
    if (value.length === RESET_CODE_LENGTH) {
      form.verifyResetCode(value, () => setStep('resetPasswordForm'));
    }
  }

  function handleBackPress() {
    setError(null);
    setErrorAction(null);
    setShowResendConfirmation(false);
    if (formStep === 'forgotPasswordForm') {
      setStep('loginForm');
    } else if (formStep === 'codeEntryForm') {
      setStep('forgotPasswordForm');
    } else {
      setStep('initial');
      form.reset();
    }
  }

  const loginSlotOffset = formStep === 'loginForm' && showResendConfirmation ? 1 : 0;

  const isCheckEmail = step === 'checkEmail';
  const visiblePositions = Object.values(slots)
    .filter((s) => s.visible)
    .map((s) => s.position);
  const highestVisiblePosition = visiblePositions.length > 0 ? Math.max(...visiblePositions) : 0;
  const contentHeight = (highestVisiblePosition + 1) * SLOT_HEIGHT;
  const solidHeight = isCheckEmail
    ? containerLayout.height || 200
    : logoHeight > 0
      ? logoHeight + CONTAINER_GAP + contentHeight + CONTAINER_PADDING * 2 + SOLID_HEIGHT_BUFFER
      : containerLayout.height;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} className="bg-background">
        <View style={{ flex: 1 }}>
          <AuthBackground color={colors.primary} />

          <AuthBlend
            anchorY={Math.max(0, containerLayout.y - SOLID_TOP_BUFFER)}
            solidHeight={solidHeight + SOLID_TOP_BUFFER}
            screenHeight={screenHeight}
            color={colors.background}
            fadeFraction={0.9}
          />

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <View
              onLayout={handleContainerLayout}
              style={{ width: '100%', alignItems: 'center', justifyContent: 'center', padding: CONTAINER_PADDING, gap: CONTAINER_GAP }}
            >
              <View onLayout={handleLogoLayout}>
                <LogoSplash mainColor={colors.primary} accentColor={colors.level2} symbolSquareColor={colors.level2} symbolCubeColor={colors.primary} subtitleColor={colors.primary} />
              </View>

              {step === 'checkEmail' ? (
                <View className="items-center gap-4">
                  <Text className="font-body text-foreground text-center">Check your email to confirm your account.</Text>
                  <Text className="font-body text-muted-foreground text-center text-sm">
                    Already have an account? Try resetting your password instead.
                  </Text>
                  <Button variant="ghost" onPress={() => { setStep('initial'); form.reset(); }}>
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
                      value={formStep === 'loginForm' || formStep === 'forgotPasswordForm' ? form.loginIdentifier : form.email}
                      onChangeText={formStep === 'loginForm' || formStep === 'forgotPasswordForm' ? form.handleLoginIdentifierChange : form.handleEmailChange}
                      onBlur={formStep === 'signUpForm' ? () => form.checkEmailFormat(form.email) : undefined}
                      autoCapitalize="none"
                      keyboardType={formStep === 'signUpForm' ? 'email-address' : 'default'}
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
                      textContentType="newPassword"
                      className="border-primary text-primary"
                      error={!!form.fieldErrors.password}
                      iconColor={colors.primary}
                      value={form.password}
                      onChangeText={form.handlePasswordChange}
                      onBlur={() => { form.checkPasswordsMatch(); form.checkPasswordLength(); }}
                    />
                  </AnimatedSlot>

                  <AnimatedSlot {...slotProps('confirmPassword')} errorText={form.fieldErrors.confirmPassword}>
                    <PasswordInput
                      placeholder="Confirm Password"
                      textContentType="password"
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
                      textContentType="newPassword"
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
                      textContentType="password"
                      className="border-primary text-primary"
                      error={!!form.fieldErrors.confirmNewPassword}
                      iconColor={colors.primary}
                      value={form.confirmNewPassword}
                      onChangeText={form.handleConfirmNewPasswordChange}
                      onBlur={form.checkNewPasswordsMatch}
                    />
                  </AnimatedSlot>

                  <AnimatedSlot {...slotProps('primaryAction')} errorText={error} errorAction={errorAction}>
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

                  <AnimatedSlot
                    position={slots.resendConfirmation.position}
                    visible={formStep === 'loginForm' && showResendConfirmation}
                    moveDelay={slots.resendConfirmation.moveDelay}
                    fadeDelay={slots.resendConfirmation.fadeDelay}
                  >
                    <Button variant="link" onPress={handleResendConfirmation} disabled={loading}>
                      <Text>Resend confirmation email</Text>
                    </Button>
                  </AnimatedSlot>

                  <AnimatedSlot
                    position={slots.forgotPassword.position + loginSlotOffset}
                    visible={slots.forgotPassword.visible}
                    moveDelay={slots.forgotPassword.moveDelay}
                    fadeDelay={slots.forgotPassword.fadeDelay}
                  >
                    <Button variant="link" onPress={handleForgotPasswordPress}>
                      <Text>Forgot Password?</Text>
                    </Button>
                  </AnimatedSlot>

                  <AnimatedSlot {...slotProps('resetAction')}>
                    <Button
                      className="bg-level2"
                      onPress={handleResetActionPress}
                      disabled={
                        loading ||
                        (formStep === 'resetPasswordForm'
                          ? !form.isResetPasswordValid
                          : form.loginIdentifier.trim().length === 0 || form.resendCooldown > 0)
                      }
                    >
                      {loading ? (
                        <LoadingSpinner size={20} color={colors.primary} blendColors={[colors.primary, colors.primary, colors.primary]} />
                      ) : (
                        <Text>
                          {formStep === 'resetPasswordForm'
                            ? 'Set New Password'
                            : form.resendCooldown > 0
                              ? `Wait ${form.resendCooldown}s`
                              : 'Get Confirmation Code'}
                        </Text>
                      )}
                    </Button>
                  </AnimatedSlot>

                  <AnimatedSlot
                    {...slotProps('resendCode')}
                    errorText={
                      formStep === 'codeEntryForm'
                        ? form.resendCooldown > 0
                          ? `Reset password confirmation code sent via email. You can request a new code in ${form.resendCooldown}s.`
                          : 'Reset password confirmation code sent via email.'
                        : null
                    }
                  >
                    <Button variant="link" onPress={handleResendCode} disabled={loading || form.resendCooldown > 0}>
                      <Text>{form.resendCooldown > 0 ? `Send new code in ${form.resendCooldown}s` : 'Send new confirmation code'}</Text>
                    </Button>
                  </AnimatedSlot>

                  <AnimatedSlot
                    position={slots.back.position + loginSlotOffset}
                    visible={slots.back.visible}
                    moveDelay={slots.back.moveDelay}
                    fadeDelay={slots.back.fadeDelay}
                  >
                    <Button variant="ghost" onPress={handleBackPress}>
                      <Text>Back</Text>
                    </Button>
                  </AnimatedSlot>
                </AnimatedSlotContainer>
              )}
            </View>
          </View>
        </View>

      </Pressable>
    </KeyboardAvoidingView>
  );
}