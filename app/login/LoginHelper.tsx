// app/login/LoginHelper.tsx

import { 
  INVALID_EMAIL,
  VALIDATE_INPUT,
  REQUIRED_TOKEN,
  getFirebaseErrorMessage,
} from "./loginConstant";

/**
 * Validates email format using regex
 * @param email - Email string to validate
 * @returns true if email format is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requirements: At least 8 characters, contains letters and numbers
 * @param password - Password string to validate
 * @returns true if password meets strength requirements
 */
export function isStrongPassword(password: string): boolean {
  if (!password || password.length < 8) return false;
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasLetter && hasNumber;
}

/**
 * Sanitizes email by trimming whitespace and converting to lowercase
 * @param email - Email string to sanitize
 * @returns Sanitized email string
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Gets user-friendly error message from error object
 * @param error - Error object from Firebase or other sources
 * @returns User-friendly error message
 */
export function getLoginErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred!";
  
  // Check for Firebase error code first
  if (error.code) {
    return getFirebaseErrorMessage(error.code);
  }
  
  // Fallback to error message
  if (error.message) {
    return error.message;
  }
  
  return "An unexpected error occurred!";
}

/**
 * Validates login input before submission (for email/password login)
 * @param email - User's email
 * @param password - User's password
 * @returns Validation result with valid flag and optional error message
 */
export function validateLoginInput(
  email: string, 
  password: string
): { valid: boolean; error?: string } {
  // Check if both fields are filled
  if (!email || !password) {
    return { valid: false, error: VALIDATE_INPUT };
  }

  // Sanitize and validate email
  const cleanEmail = sanitizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return { valid: false, error: INVALID_EMAIL };
  }

  return { valid: true };
}

/**
 * Validates login input for social providers (Google, etc.)
 * Social logins don't require password
 * @param idToken - ID token from social provider
 * @returns Validation result with valid flag and optional error message
 */
export function validateSocialLogin(idToken: string): { valid: boolean; error?: string } {
  if (!idToken) {
    return { valid: false, error: REQUIRED_TOKEN };
  }

  return { valid: true };
}

/**
 * Validates password reset input
 * @param email - User's email for password reset
 * @returns Validation result with valid flag and optional error message
 */
export function validatePasswordReset(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Please enter your email address" };
  }

  const cleanEmail = sanitizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return { valid: false, error: INVALID_EMAIL };
  }

  return { valid: true };
}

/**
 * Formats user data for display
 * @param user - User object from Firebase
 * @returns Formatted user data
 */
export function formatUserData(user: any) {
  return {
    email: user?.email || "",
    displayName: user?.displayName || user?.name || "User",
    photoURL: user?.photoURL || null,
    emailVerified: user?.emailVerified || false,
    uid: user?.uid || "",
  };
}

/**
 * Checks if error is a network error
 * @param error - Error object
 * @returns true if it's a network-related error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const networkErrorCodes = [
    "auth/network-request-failed",
    "auth/timeout",
  ];
  
  return networkErrorCodes.includes(error?.code);
}

/**
 * Checks if error is a rate limit error
 * @param error - Error object
 * @returns true if it's a rate limiting error
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  return error?.code === "auth/too-many-requests";
}

/**
 * Checks if user should be allowed to retry login
 * @param error - Error object
 * @returns true if user can retry immediately
 */
export function canRetryLogin(error: any): boolean {
  if (!error) return true;
  
  // Don't allow immediate retry for rate limiting
  if (isRateLimitError(error)) return false;
  
  // Don't allow retry for permanent errors
  const permanentErrors = [
    "auth/user-disabled",
    "auth/user-not-found",
  ];
  
  return !permanentErrors.includes(error?.code);
}

/**
 * Gets suggested action based on error type
 * @param error - Error object
 * @returns Suggested action message
 */
export function getSuggestedAction(error: any): string {
  if (!error?.code) return "";
  
  const suggestions: { [key: string]: string } = {
    "auth/user-not-found": "Try signing up for a new account.",
    "auth/wrong-password": "Try resetting your password.",
    "auth/too-many-requests": "Wait a few minutes and try again.",
    "auth/network-request-failed": "Check your internet connection and try again.",
    "auth/popup-blocked": "Allow popups in your browser settings.",
    "auth/user-disabled": "Contact support for assistance.",
  };
  
  return suggestions[error.code] || "";
}