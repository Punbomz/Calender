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
import { FieldValue } from "firebase-admin/firestore";

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
      // Create user record if it doesn't exist (new user) - using the new template
      const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || "User";
      const photoURL = decodedToken.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.charAt(0))}&background=random`;
      
      const userData = {
        uid: uid,
        displayName: displayName,
        originalDisplayName: displayName, // Store original display name
        email: decodedToken.email || email,
        photoURL: photoURL,
        originalPhotoURL: photoURL, // Store original photo URL
        googleEmail: isSocialLogin && decodedToken.firebase?.sign_in_provider === "google.com" ? decodedToken.email : null,
        googleLinked: isSocialLogin && decodedToken.firebase?.sign_in_provider === "google.com",
        lastLogin: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        role: "user", // Default role
      };
      
      await adminDb.collection("users").doc(uid).set(userData);
      console.log("New user created:", uid);
    } else {
      // Update last login and updatedAt for existing user
      await adminDb.collection("users").doc(uid).update({
        lastLogin: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
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