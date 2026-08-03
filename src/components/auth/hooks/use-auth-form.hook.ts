import { useDebouncedCallback } from '@/hooks/use-debounced-callback.hook';
import { supabase } from '@/utils/supabase';
import { useState } from 'react';
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '../auth.constants';
import type { FieldKey, FormStep } from '../steps.config';

export function useAuthForm(formStep: FormStep) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, email: error.message }));
      return false;
    }
    return true;
  }

  async function verifyResetCode(code: string, onSuccess: () => void) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) {
      setFieldErrors((prev) => ({ ...prev, resetCode: 'Invalid or expired code.' }));
    } else {
      onSuccess();
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
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setFieldErrors((prev) => ({ ...prev, newPassword: error.message }));
    } else {
      await supabase.auth.signOut();
      onSuccess();
    }
  }

  function reset() {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setFieldErrors({});
  }

  const isLoginValid = email.trim().length > 0 && password.length > 0;
  const isSignUpValid =
    EMAIL_PATTERN.test(email) &&
    USERNAME_PATTERN.test(username) &&
    !fieldErrors.username &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirmPassword;
  const isResetPasswordValid =
    newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmNewPassword;

  return {
    email, username, password, confirmPassword, resetCode, newPassword, confirmNewPassword,
    fieldErrors, setFieldErrors,
    handleEmailChange, handleUsernameChange, handlePasswordChange, handleConfirmPasswordChange,
    handleNewPasswordChange, handleConfirmNewPasswordChange, handleResetCodeChange,
    checkEmailFormat, checkUsernameAvailability, checkPasswordsMatch, checkNewPasswordsMatch,
    sendResetCode, verifyResetCode, submitNewPassword,
    isLoginValid, isSignUpValid, isResetPasswordValid, reset,
  };
}