import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_LOWERCASE_MESSAGE,
  PASSWORD_NUMBER_MESSAGE,
  PASSWORD_UPPERCASE_MESSAGE,
  PASSWORD_NOT_MATCH_MESSAGE,
} from "./registerConstant";

export function passwordValidation(password: string, confirmPassword: string) {
  const errors: string[] = [];

  if (password !== confirmPassword) {
    errors.push(PASSWORD_NOT_MATCH_MESSAGE);
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(PASSWORD_MIN_LENGTH_MESSAGE);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(PASSWORD_UPPERCASE_MESSAGE);
  }

  if (!/[a-z]/.test(password)) {
    errors.push(PASSWORD_LOWERCASE_MESSAGE);
  }

  if (!/[0-9]/.test(password)) {
    errors.push(PASSWORD_NUMBER_MESSAGE);
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function checkEmailExists(email: string) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    // If there are providers, email is already in use
    if (methods.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}
