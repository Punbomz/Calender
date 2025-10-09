import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE, PASSWORD_LOWERCASE_MESSAGE, PASSWORD_NUMBER_MESSAGE, PASSWORD_UPPERCASE_MESSAGE, PASSWORD_NOT_MATCH_MESSAGE, EMAIL_ALREADY_IN_USE_MESSAGE } from "./registerConstant";

export function passwordValidation(password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
        alert(PASSWORD_NOT_MATCH_MESSAGE);
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        alert(PASSWORD_MIN_LENGTH_MESSAGE);
    }

    if (!/[A-Z]/.test(password)) {
        alert(PASSWORD_UPPERCASE_MESSAGE);
    }

    if (!/[a-z]/.test(password)) {
        alert(PASSWORD_LOWERCASE_MESSAGE);
    }

    if (!/[0-9]/.test(password)) {
        alert(PASSWORD_NUMBER_MESSAGE);
    }
}

export function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function checkEmailExists(email: string) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    // ถ้ามี provider แสดงว่า email นี้ถูกใช้แล้ว
    if (methods.length > 0) {
      alert(EMAIL_ALREADY_IN_USE_MESSAGE);
      return true; // ซ้ำ
    }
    return false; // ยังไม่ซ้ำ
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}