/**
 * Authentication utility functions
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

export interface ValidationError {
  field: string;
  message: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
}

export interface SigninFormData {
  email: string;
  password: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Please enter your email';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validate signup form data
 */
export function validateSignup(data: SignupFormData): string | null {
  const emailError = validateEmail(data.email);
  if (emailError) return emailError;

  if (!data.fullName.trim()) {
    return 'Please enter your full name';
  }

  if (!data.password) {
    return 'Please enter a password';
  }

  if (data.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (data.password !== data.confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}

/**
 * Validate signin form data
 */
export function validateSignin(data: SigninFormData): string | null {
  const emailError = validateEmail(data.email);
  if (emailError) return emailError;

  if (!data.password) {
    return 'Please enter your password';
  }

  return null;
}

/**
 * Get base URL for redirects
 */
export function getBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://saro2.ai';
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

/**
 * Get redirect path after login
 */
export function getRedirectPath(): string {
  if (typeof window !== 'undefined') {
    const savedPath = sessionStorage.getItem('redirectAfterLogin');
    if (savedPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      return savedPath;
    }
  }
  return '/text-to-video';
}

