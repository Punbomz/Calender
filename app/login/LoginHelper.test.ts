// app/login/LoginHelper.test.ts

import {
  isValidEmail,
  isStrongPassword,
  sanitizeEmail,
  getLoginErrorMessage,
  validateLoginInput,
  validateSocialLogin,
  validatePasswordReset,
  formatUserData,
  isNetworkError,
  isRateLimitError,
  canRetryLogin,
  getSuggestedAction,
} from "./LoginHelper";

import {
  INVALID_EMAIL,
  VALIDATE_INPUT,
  REQUIRED_TOKEN,
  ACCOUNT_NOT_FOUND,
  TOO_MANY_REQUESTS,
  NETWORK_ERROR,
  getFirebaseErrorMessage,
} from "./loginConstant";

describe("LoginHelper Tests", () => {
  
  // ========== Email Validation Tests ==========
  describe("isValidEmail", () => {
    it("should validate correct email formats", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("test+tag@example.com")).toBe(true);
      expect(isValidEmail("user123@test-domain.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("invalid@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("invalid@domain")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("user @example.com")).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isValidEmail("")).toBe(false);
    });
  });

  // ========== Password Validation Tests ==========
  describe("isStrongPassword", () => {
    it("should validate strong passwords", () => {
      expect(isStrongPassword("SecurePass123")).toBe(true);
      expect(isStrongPassword("MyP@ssw0rd")).toBe(true);
      expect(isStrongPassword("Test1234")).toBe(true);
      expect(isStrongPassword("abcdefg1")).toBe(true);
    });

    it("should reject weak passwords", () => {
      expect(isStrongPassword("weak")).toBe(false); // Too short
      expect(isStrongPassword("12345678")).toBe(false); // No letters
      expect(isStrongPassword("password")).toBe(false); // No numbers
      expect(isStrongPassword("short1")).toBe(false); // Less than 8 chars
      expect(isStrongPassword("")).toBe(false); // Empty
    });
  });

  // ========== Email Sanitization Tests ==========
  describe("sanitizeEmail", () => {
    it("should trim and lowercase email", () => {
      expect(sanitizeEmail("  TEST@EXAMPLE.COM  ")).toBe("test@example.com");
      expect(sanitizeEmail("User@Domain.Com")).toBe("user@domain.com");
      expect(sanitizeEmail("  user@test.com")).toBe("user@test.com");
    });

    it("should handle empty strings", () => {
      expect(sanitizeEmail("")).toBe("");
    });
  });

  // ========== Error Message Extraction Tests ==========
  describe("getLoginErrorMessage", () => {
    it("should return mapped error for Firebase errors with code", () => {
      const mockError = { code: "auth/user-not-found" };
      expect(getLoginErrorMessage(mockError)).toBe(ACCOUNT_NOT_FOUND);
    });

    it("should return error message when no code exists", () => {
      const mockError = { message: "Custom error message" };
      expect(getLoginErrorMessage(mockError)).toBe("Custom error message");
    });

    it("should return generic error for unknown errors", () => {
      const mockError = {};
      expect(getLoginErrorMessage(mockError)).toBe("An unexpected error occurred!");
    });

    it("should handle null or undefined error", () => {
      expect(getLoginErrorMessage(null)).toBe("An unexpected error occurred!");
      expect(getLoginErrorMessage(undefined)).toBe("An unexpected error occurred!");
    });
  });

  // ========== Login Input Validation Tests ==========
  describe("validateLoginInput", () => {
    it("should fail when email is empty", () => {
      const result = validateLoginInput("", "password123");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(VALIDATE_INPUT);
    });

    it("should fail when password is empty", () => {
      const result = validateLoginInput("test@example.com", "");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(VALIDATE_INPUT);
    });

    it("should fail when both are empty", () => {
      const result = validateLoginInput("", "");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(VALIDATE_INPUT);
    });

    it("should fail when email format is invalid", () => {
      const result = validateLoginInput("invalid-email", "password123");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVALID_EMAIL);
    });

    it("should pass with valid email and password", () => {
      const result = validateLoginInput("test@example.com", "SecurePass123");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should sanitize email before validation", () => {
      const result = validateLoginInput("  TEST@EXAMPLE.COM  ", "password123");
      expect(result.valid).toBe(true);
    });
  });

  // ========== Social Login Validation Tests ==========
  describe("validateSocialLogin", () => {
    it("should fail when token is empty", () => {
      const result = validateSocialLogin("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(REQUIRED_TOKEN);
    });

    it("should pass with valid token", () => {
      const result = validateSocialLogin("valid-token-123");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // ========== Password Reset Validation Tests ==========
  describe("validatePasswordReset", () => {
    it("should fail when email is empty", () => {
      const result = validatePasswordReset("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Please enter your email address");
    });

    it("should fail when email format is invalid", () => {
      const result = validatePasswordReset("invalid-email");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(INVALID_EMAIL);
    });

    it("should pass with valid email", () => {
      const result = validatePasswordReset("test@example.com");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // ========== User Data Formatting Tests ==========
  describe("formatUserData", () => {
    it("should format complete user data", () => {
      const mockUser = {
        email: "test@example.com",
        displayName: "Test User",
        photoURL: "https://example.com/photo.jpg",
        emailVerified: true,
        uid: "user123",
      };

      const formatted = formatUserData(mockUser);
      expect(formatted.email).toBe("test@example.com");
      expect(formatted.displayName).toBe("Test User");
      expect(formatted.photoURL).toBe("https://example.com/photo.jpg");
      expect(formatted.emailVerified).toBe(true);
      expect(formatted.uid).toBe("user123");
    });

    it("should handle missing optional fields", () => {
      const mockUser = {
        email: "test@example.com",
        uid: "user123",
      };

      const formatted = formatUserData(mockUser);
      expect(formatted.email).toBe("test@example.com");
      expect(formatted.displayName).toBe("User");
      expect(formatted.photoURL).toBe(null);
      expect(formatted.emailVerified).toBe(false);
    });

    it("should handle null user", () => {
      const formatted = formatUserData(null);
      expect(formatted.email).toBe("");
      expect(formatted.displayName).toBe("User");
      expect(formatted.uid).toBe("");
    });
  });

  // ========== Network Error Detection Tests ==========
  describe("isNetworkError", () => {
    it("should detect network errors", () => {
      expect(isNetworkError({ code: "auth/network-request-failed" })).toBe(true);
      expect(isNetworkError({ code: "auth/timeout" })).toBe(true);
    });

    it("should return false for non-network errors", () => {
      expect(isNetworkError({ code: "auth/user-not-found" })).toBe(false);
      expect(isNetworkError({ code: "auth/wrong-password" })).toBe(false);
    });

    it("should handle null or undefined", () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  // ========== Rate Limit Error Detection Tests ==========
  describe("isRateLimitError", () => {
    it("should detect rate limit errors", () => {
      expect(isRateLimitError({ code: "auth/too-many-requests" })).toBe(true);
    });

    it("should return false for other errors", () => {
      expect(isRateLimitError({ code: "auth/user-not-found" })).toBe(false);
      expect(isRateLimitError({ code: "auth/network-request-failed" })).toBe(false);
    });

    it("should handle null or undefined", () => {
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError(undefined)).toBe(false);
    });
  });

  // ========== Retry Logic Tests ==========
  describe("canRetryLogin", () => {
    it("should allow retry for temporary errors", () => {
      expect(canRetryLogin({ code: "auth/wrong-password" })).toBe(true);
      expect(canRetryLogin({ code: "auth/network-request-failed" })).toBe(true);
    });

    it("should not allow retry for rate limit errors", () => {
      expect(canRetryLogin({ code: "auth/too-many-requests" })).toBe(false);
    });

    it("should not allow retry for permanent errors", () => {
      expect(canRetryLogin({ code: "auth/user-disabled" })).toBe(false);
      expect(canRetryLogin({ code: "auth/user-not-found" })).toBe(false);
    });

    it("should allow retry when no error", () => {
      expect(canRetryLogin(null)).toBe(true);
    });
  });

  // ========== Suggested Action Tests ==========
  describe("getSuggestedAction", () => {
    it("should suggest appropriate actions for different errors", () => {
      expect(getSuggestedAction({ code: "auth/user-not-found" }))
        .toBe("Try signing up for a new account.");
      
      expect(getSuggestedAction({ code: "auth/wrong-password" }))
        .toBe("Try resetting your password.");
      
      expect(getSuggestedAction({ code: "auth/too-many-requests" }))
        .toBe("Wait a few minutes and try again.");
      
      expect(getSuggestedAction({ code: "auth/network-request-failed" }))
        .toBe("Check your internet connection and try again.");
      
      expect(getSuggestedAction({ code: "auth/popup-blocked" }))
        .toBe("Allow popups in your browser settings.");
      
      expect(getSuggestedAction({ code: "auth/user-disabled" }))
        .toBe("Contact support for assistance.");
    });

    it("should return empty string for unmapped errors", () => {
      expect(getSuggestedAction({ code: "auth/unknown-error" })).toBe("");
    });

    it("should return empty string when no error code", () => {
      expect(getSuggestedAction({})).toBe("");
      expect(getSuggestedAction(null)).toBe("");
    });
  });

  // ========== Firebase Error Message Mapping Tests ==========
  describe("Firebase Error Message Mapping", () => {
    it("should map common Firebase errors correctly", () => {
      expect(getFirebaseErrorMessage("auth/invalid-credential")).toBe("Invalid credentials provided!");
      expect(getFirebaseErrorMessage("auth/user-not-found")).toBe(ACCOUNT_NOT_FOUND);
      expect(getFirebaseErrorMessage("auth/wrong-password")).toBe("Password is incorrect!");
      expect(getFirebaseErrorMessage("auth/too-many-requests")).toBe(TOO_MANY_REQUESTS);
      expect(getFirebaseErrorMessage("auth/network-request-failed")).toBe(NETWORK_ERROR);
      expect(getFirebaseErrorMessage("auth/popup-closed-by-user")).toBe("Sign-in popup was closed!");
      expect(getFirebaseErrorMessage("auth/popup-blocked")).toBe("Popup was blocked! Please allow popups for this site.");
      expect(getFirebaseErrorMessage("auth/invalid-email")).toBe(INVALID_EMAIL);
    });

    it("should return unknown error for unmapped codes", () => {
      expect(getFirebaseErrorMessage("auth/unknown-error-code")).toBe("An unexpected error occurred!");
    });
  });
});

// ========== Integration Tests ==========
describe("Login Flow Integration Tests", () => {
  describe("Email/Password Login Flow", () => {
    it("should validate and sanitize input before login", () => {
      const email = "  TEST@EXAMPLE.COM  ";
      const password = "SecurePass123";

      const cleanEmail = sanitizeEmail(email);
      expect(cleanEmail).toBe("test@example.com");

      const validation = validateLoginInput(cleanEmail, password);
      expect(validation.valid).toBe(true);
    });

    it("should handle complete error flow", () => {
      const mockError = { code: "auth/wrong-password" };
      
      const errorMessage = getLoginErrorMessage(mockError);
      expect(errorMessage).toBe("Password is incorrect!");
      
      const canRetry = canRetryLogin(mockError);
      expect(canRetry).toBe(true);
      
      const suggestion = getSuggestedAction(mockError);
      expect(suggestion).toBe("Try resetting your password.");
    });
  });

  describe("Google Sign-In Flow", () => {
    it("should validate token for social login", () => {
      const token = "mock-google-token-123";
      
      const validation = validateSocialLogin(token);
      expect(validation.valid).toBe(true);
    });

    it("should handle popup blocked error", () => {
      const mockError = { code: "auth/popup-blocked" };
      
      const errorMessage = getLoginErrorMessage(mockError);
      expect(errorMessage).toBe("Popup was blocked! Please allow popups for this site.");
      
      const suggestion = getSuggestedAction(mockError);
      expect(suggestion).toBe("Allow popups in your browser settings.");
    });
  });

  describe("Password Reset Flow", () => {
    it("should validate email for password reset", () => {
      const email = "test@example.com";
      
      const validation = validatePasswordReset(email);
      expect(validation.valid).toBe(true);
    });

    it("should reject invalid email for password reset", () => {
      const validation = validatePasswordReset("invalid-email");
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe(INVALID_EMAIL);
    });
  });
});