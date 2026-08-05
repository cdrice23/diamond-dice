import { useDebouncedCallback } from '@/hooks/use-debounced-callback.hook';
import { supabase } from '@/utils/supabase';
import { useEffect, useRef, useState } from 'react';
import { getAuthErrorInfo } from '../auth-errors';
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, RESEND_COOLDOWN_SECONDS, USERNAME_PATTERN } from '../auth.constants';
import type { FieldKey, FormStep } from '../steps.config';

export function useAuthForm(formStep: FormStep) {
  const [email, setEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResendCooldown, setConfirmationResendCooldown] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmationCooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown(
    setter: React.Dispatch<React.SetStateAction<number>>,
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  ) {
    setter(RESEND_COOLDOWN_SECONDS);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (confirmationCooldownIntervalRef.current) clearInterval(confirmationCooldownIntervalRef.current);
    };
  }, []);

  async function checkUsernameAvailability(value: string) {
    if (!USERNAME_PATTERN.test(value)) {
      setFieldErrors((prev) => ({
        ...prev,
        username: value.length > 0 ? 'Username must be 3–20 characters: letters, numbers, underscores, or periods.' : undefined,
      }));
      return;
    }
    const { data } = await supabase.from('profiles').select('id').eq('username', value).maybeSingle();
    setFieldErrors((prev) => ({ ...prev, username: data ? 'Username is already taken.' : undefined }));
  }

  const debouncedUsernameCheck = useDebouncedCallback(checkUsernameAvailability, 500);

  function checkEmailFormat(value: string) {
    if (formStep !== 'signUpForm') return;
    setFieldErrors((prev) => ({ ...prev, email: value.length > 0 && !EMAIL_PATTERN.test(value) ? 'Please enter a valid email address.' : undefined }));
  }

  function checkPasswordsMatch() {
    if (confirmPassword.length === 0) return;
    setFieldErrors((prev) => ({ ...prev, confirmPassword: password === confirmPassword ? undefined : 'Passwords do not match.' }));
  }

  function checkNewPasswordsMatch() {
    if (confirmNewPassword.length === 0) return;
    setFieldErrors((prev) => ({ ...prev, confirmNewPassword: newPassword === confirmNewPassword ? undefined : 'Passwords do not match.' }));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (EMAIL_PATTERN.test(value) || value.length === 0) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handleLoginIdentifierChange(value: string) {
    setLoginIdentifier(value);
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    if (value.length === 0) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
    } else {
      debouncedUsernameCheck(value);
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (confirmPassword.length > 0 && value === confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    if (value.length === 0 || value === password) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  }

  function handleNewPasswordChange(value: string) {
    setNewPassword(value);
    if (confirmNewPassword.length > 0 && value === confirmNewPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmNewPassword: undefined }));
    }
  }

  function handleConfirmNewPasswordChange(value: string) {
    setConfirmNewPassword(value);
    if (value.length === 0 || value === newPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmNewPassword: undefined }));
    }
  }

  function handleResetCodeChange(value: string) {
    setResetCode(value);
    setFieldErrors((prev) => ({ ...prev, resetCode: undefined }));
  }

  async function sendResetCode(): Promise<boolean> {
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        const { message } = getAuthErrorInfo(error);
        setFieldErrors((prev) => ({ ...prev, email: message }));
        return false;
      }
      startCooldown(setResendCooldown, cooldownIntervalRef);
      return true;
    } catch (err) {
      const { message } = getAuthErrorInfo(err);
      setFieldErrors((prev) => ({ ...prev, email: message }));
      return false;
    }
  }

  async function resendConfirmationEmail(targetEmail: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: targetEmail });
      if (error) return false;
      startCooldown(setConfirmationResendCooldown, confirmationCooldownIntervalRef);
      return true;
    } catch {
      return false;
    }
  }

  async function verifyResetCode(code: string, onSuccess: () => void) {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
      if (error) {
        setFieldErrors((prev) => ({ ...prev, resetCode: 'Invalid or expired code.' }));
      } else {
        onSuccess();
      }
    } catch (err) {
      const { message } = getAuthErrorInfo(err);
      setFieldErrors((prev) => ({ ...prev, resetCode: message }));
    }
  }

  async function submitNewPassword(onSuccess: () => void) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFieldErrors((prev) => ({ ...prev, newPassword: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmNewPassword: 'Passwords do not match.' }));
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        const { message } = getAuthErrorInfo(error);
        setFieldErrors((prev) => ({ ...prev, newPassword: message }));
      } else {
        await supabase.auth.signOut();
        onSuccess();
      }
    } catch (err) {
      const { message } = getAuthErrorInfo(err);
      setFieldErrors((prev) => ({ ...prev, newPassword: message }));
    }
  }

  function reset() {
    setEmail('');
    setLoginIdentifier('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setFieldErrors({});
    setResendCooldown(0);
    setConfirmationResendCooldown(0);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    if (confirmationCooldownIntervalRef.current) clearInterval(confirmationCooldownIntervalRef.current);
  }

  const isLoginValid = loginIdentifier.trim().length > 0 && password.length > 0;
  const isSignUpValid =
    EMAIL_PATTERN.test(email) &&
    USERNAME_PATTERN.test(username) &&
    !fieldErrors.username &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirmPassword;
  const isResetPasswordValid =
    newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmNewPassword;

  return {
    email, loginIdentifier, username, password, confirmPassword, resetCode, newPassword, confirmNewPassword,
    fieldErrors, setFieldErrors,
    resendCooldown, confirmationResendCooldown,
    handleEmailChange, handleLoginIdentifierChange, handleUsernameChange, handlePasswordChange, handleConfirmPasswordChange,
    handleNewPasswordChange, handleConfirmNewPasswordChange, handleResetCodeChange,
    checkEmailFormat, checkUsernameAvailability, checkPasswordsMatch, checkNewPasswordsMatch,
    sendResetCode, verifyResetCode, submitNewPassword, resendConfirmationEmail,
    isLoginValid, isSignUpValid, isResetPasswordValid, reset,
  };
}