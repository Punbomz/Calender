// app/login/login.tsx
"use server";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { 
  VALIDATE_INPUT,
  REQUIRED_TOKEN,
  LOGIN_COMPLETE,
  LOGIN_FAILED,
  getFirebaseErrorMessage,
} from "./loginConstant";

interface LoginResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export async function loginUser(
  email: string,
  password: string,
  idToken: string
): Promise<LoginResponse> {
  try {
    // Validate idToken is required
    if (!idToken) {
      return {
        success: false,
        error: REQUIRED_TOKEN,
      };
    }

    // Verify ID Token first
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if this is a social login (Google, etc.)
    const isSocialLogin = decodedToken.firebase?.sign_in_provider !== "password";

    // Only validate email/password for non-social logins
    if (!isSocialLogin && (!email || !password)) {
      return {
        success: false,
        error: VALIDATE_INPUT,
      };
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      // Create user record if it doesn't exist (new user)
      const userData = {
        email: decodedToken.email,
        name: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        provider: decodedToken.firebase?.sign_in_provider || "email",
        uid: uid,
      };
      
      await adminDb.collection("users").doc(uid).set(userData);
      console.log("New user created:", uid);
    } else {
      // Update last login for existing user
      await adminDb.collection("users").doc(uid).update({
        lastLogin: new Date().toISOString(),
      });
      console.log("Existing user logged in:", uid);
    }

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set session cookie - await the cookies() call
    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return {
      success: true,
      message: LOGIN_COMPLETE,
    };
  } catch (error: any) {
    console.error("Login error:", error);

    // Use the error code mapping from constants
    if (error.code) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Fallback to error message or generic failure
    return {
      success: false,
      error: error.message || LOGIN_FAILED,
    };
  }
}