// app/login/loginConstant.tsx

// Input Validation Errors
export const VALIDATE_INPUT = "You have to fill both email and password!";
export const REQUIRED_TOKEN = "Authentication token is required.";
export const INVALID_EMAIL = "Invalid email format!";

// Authentication Errors
export const EMAIL_PASSWORD_INCORRECT = "Email or password is incorrect!";
export const ACCOUNT_NOT_FOUND = "Account not found! Sign up?";
export const WRONG_PASSWORD = "Password is incorrect!";
export const INVALID_CREDENTIAL = "Invalid credentials provided!";

// Account Status Errors
export const USER_DISABLED = "This account has been disabled!";

// Rate Limiting
export const TOO_MANY_REQUESTS = "Too many login attempts! Please try again later.";

// Session & Token Errors
export const SESSION_EXPIRED = "Session expired! Please log in again!";
export const TOKEN_EXPIRED = "Authentication token expired!";

// Network Errors
export const NETWORK_ERROR = "Network error! Please check your connection.";

// Google Sign-In Errors
export const POPUP_CLOSED = "Sign-in popup was closed!";
export const POPUP_BLOCKED = "Popup was blocked! Please allow popups for this site.";

// General Errors
export const LOGIN_FAILED = "Login failed! Please try again.";
export const UNKNOWN_ERROR = "An unexpected error occurred!";

// Success Messages
export const LOGIN_COMPLETE = "Login successful!";
export const LOGOUT_COMPLETE = "Logout complete!";
export const LOGOUT_FAILED = "Logout failed!";
export const PASSWORD_RESET_SENT = "Password reset link sent to your email!";

// Firebase Error Code Mapping (Most Common Errors Only)
export const FIREBASE_ERROR_MAP: { [key: string]: string } = {
  // Authentication errors
  "auth/invalid-credential": INVALID_CREDENTIAL,
  "auth/user-not-found": ACCOUNT_NOT_FOUND,
  "auth/wrong-password": WRONG_PASSWORD,
  "auth/email-already-in-use": "Email is already registered!",
  "auth/weak-password": "Password is too weak!",
  
  // Account status
  "auth/user-disabled": USER_DISABLED,
  
  // Rate limiting
  "auth/too-many-requests": TOO_MANY_REQUESTS,
  
  // Token/Session errors
  "auth/id-token-expired": TOKEN_EXPIRED,
  "auth/session-cookie-expired": SESSION_EXPIRED,
  
  // Network errors
  "auth/network-request-failed": NETWORK_ERROR,
  
  // Popup errors
  "auth/popup-closed-by-user": POPUP_CLOSED,
  "auth/popup-blocked": POPUP_BLOCKED,
  
  // Invalid input
  "auth/invalid-email": INVALID_EMAIL,
  "auth/missing-email": "Email is required!",
  "auth/missing-password": "Password is required!",
};

// Helper function to get error message from Firebase error code
export function getFirebaseErrorMessage(errorCode: string): string {
  return FIREBASE_ERROR_MAP[errorCode] || UNKNOWN_ERROR;
}