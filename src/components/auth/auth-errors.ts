import { AuthError } from '@supabase/supabase-js';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Incorrect email/username or password.',
  user_not_found: 'Incorrect email/username or password.',

  email_not_confirmed: 'Please confirm your email before logging in.',
  email_not_confirmed_for_username: "The email for this account hasn't been confirmed yet.",

  weak_password: 'Password does not meet the minimum requirements.',
  same_password: 'New password must be different from your current password.',

  user_already_exists: 'An account with this email already exists. Try logging in instead.',
  email_exists: 'An account with this email already exists. Try logging in instead.',

  over_email_send_rate_limit: 'Too many requests. Please wait a moment before trying again.',
  over_request_rate_limit: 'Too many requests. Please wait a moment before trying again.',
  over_sms_send_rate_limit: 'Too many requests. Please wait a moment before trying again.',

  signup_disabled: 'Sign ups are currently disabled.',
  email_address_invalid: 'Please enter a valid email address.',
  validation_failed: 'Please check the information you entered.',
};

const RATE_LIMIT_CODES = new Set([
  'over_email_send_rate_limit',
  'over_request_rate_limit',
  'over_sms_send_rate_limit',
]);

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = 'Check your connection and try again.';

export type AuthErrorInfo = {
  message: string;
  isRateLimit: boolean;
  isNetworkError: boolean;
  code: string | null;
};

export function getAuthErrorInfo(error: unknown): AuthErrorInfo {
  if (error instanceof AuthError) {
    const code = error.code ?? null;
    const message = code && AUTH_ERROR_MESSAGES[code] ? AUTH_ERROR_MESSAGES[code] : GENERIC_MESSAGE;
    return { message, isRateLimit: code ? RATE_LIMIT_CODES.has(code) : false, isNetworkError: false, code };
  }

  if (error instanceof TypeError || (error instanceof Error && /network/i.test(error.message))) {
    return { message: NETWORK_MESSAGE, isRateLimit: false, isNetworkError: true, code: null };
  }

  return { message: GENERIC_MESSAGE, isRateLimit: false, isNetworkError: false, code: null };
}

export function getFunctionErrorInfo(body: unknown): AuthErrorInfo {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as { error?: unknown }).error === 'object'
  ) {
    const err = (body as { error: { code?: string; message?: string } }).error;
    const code = err.code ?? null;
    const message = code && AUTH_ERROR_MESSAGES[code] ? AUTH_ERROR_MESSAGES[code] : (err.message ?? GENERIC_MESSAGE);
    return { message, isRateLimit: code ? RATE_LIMIT_CODES.has(code) : false, isNetworkError: false, code };
  }
  return { message: GENERIC_MESSAGE, isRateLimit: false, isNetworkError: false, code: null };
}