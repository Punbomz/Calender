import { passwordValidation, validateEmail, checkEmailExists } from './RegisterHelper';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_LOWERCASE_MESSAGE,
  PASSWORD_NUMBER_MESSAGE,
  PASSWORD_UPPERCASE_MESSAGE,
  PASSWORD_NOT_MATCH_MESSAGE,
  EMAIL_ALREADY_IN_USE_MESSAGE,
} from './registerConstant';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  fetchSignInMethodsForEmail: jest.fn(),
}));

jest.mock('@/lib/firebaseClient', () => ({
  auth: {},
}));

// Mock window.alert
global.alert = jest.fn();

describe('RegisterHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('passwordValidation', () => {
    it('should alert when passwords do not match', () => {
      passwordValidation('Password123', 'Password456');
      expect(alert).toHaveBeenCalledWith(PASSWORD_NOT_MATCH_MESSAGE);
    });

    it('should alert when password is too short', () => {
      passwordValidation('Pass1', 'Pass1');
      expect(alert).toHaveBeenCalledWith(PASSWORD_MIN_LENGTH_MESSAGE);
    });

    it('should alert when password has no uppercase letter', () => {
      passwordValidation('password123', 'password123');
      expect(alert).toHaveBeenCalledWith(PASSWORD_UPPERCASE_MESSAGE);
    });

    it('should alert when password has no lowercase letter', () => {
      passwordValidation('PASSWORD123', 'PASSWORD123');
      expect(alert).toHaveBeenCalledWith(PASSWORD_LOWERCASE_MESSAGE);
    });

    it('should alert when password has no number', () => {
      passwordValidation('Password', 'Password');
      expect(alert).toHaveBeenCalledWith(PASSWORD_NUMBER_MESSAGE);
    });

    it('should not alert when password meets all requirements', () => {
      const validPassword = 'Password123';
      passwordValidation(validPassword, validPassword);
      
      // Check that no validation errors were triggered
      const alertCalls = (alert as jest.Mock).mock.calls;
      const validationMessages = [
        PASSWORD_NOT_MATCH_MESSAGE,
        PASSWORD_MIN_LENGTH_MESSAGE,
        PASSWORD_UPPERCASE_MESSAGE,
        PASSWORD_LOWERCASE_MESSAGE,
        PASSWORD_NUMBER_MESSAGE,
      ];
      
      const hasValidationError = alertCalls.some(call => 
        validationMessages.includes(call[0])
      );
      
      expect(hasValidationError).toBe(false);
    });

    it('should show multiple alerts for multiple validation failures', () => {
      passwordValidation('pass', 'word');
      
      // Should show all applicable error messages
      expect(alert).toHaveBeenCalledWith(PASSWORD_NOT_MATCH_MESSAGE);
      expect(alert).toHaveBeenCalledWith(PASSWORD_MIN_LENGTH_MESSAGE);
      expect(alert).toHaveBeenCalledWith(PASSWORD_UPPERCASE_MESSAGE);
      expect(alert).toHaveBeenCalledWith(PASSWORD_NUMBER_MESSAGE);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('checkEmailExists', () => {
    const mockFetchSignInMethods = fetchSignInMethodsForEmail as jest.MockedFunction<
      typeof fetchSignInMethodsForEmail
    >;

    it('should return true and alert when email is already in use', async () => {
      mockFetchSignInMethods.mockResolvedValue(['password']);

      const result = await checkEmailExists('existing@example.com');

      expect(mockFetchSignInMethods).toHaveBeenCalledWith(auth, 'existing@example.com');
      expect(alert).toHaveBeenCalledWith(EMAIL_ALREADY_IN_USE_MESSAGE);
      expect(result).toBe(true);
    });

    it('should return false when email is not in use', async () => {
      mockFetchSignInMethods.mockResolvedValue([]);

      const result = await checkEmailExists('new@example.com');

      expect(mockFetchSignInMethods).toHaveBeenCalledWith(auth, 'new@example.com');
      expect(alert).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false and log error when Firebase call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Firebase error');
      mockFetchSignInMethods.mockRejectedValue(mockError);

      const result = await checkEmailExists('error@example.com');

      expect(mockFetchSignInMethods).toHaveBeenCalledWith(auth, 'error@example.com');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking email:', mockError);
      expect(result).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple sign-in methods', async () => {
      mockFetchSignInMethods.mockResolvedValue(['password', 'google.com']);

      const result = await checkEmailExists('multi@example.com');

      expect(alert).toHaveBeenCalledWith(EMAIL_ALREADY_IN_USE_MESSAGE);
      expect(result).toBe(true);
    });
  });
});