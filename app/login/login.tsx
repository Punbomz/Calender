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
    let uid = decodedToken.uid;
    const tokenEmail = decodedToken.email;

    // Check if this is a social login (Google, etc.)
    const isSocialLogin = decodedToken.firebase?.sign_in_provider !== "password";
    const isGoogleLogin = decodedToken.firebase?.sign_in_provider === "google.com";

    // Only validate email/password for non-social logins
    if (!isSocialLogin && (!email || !password)) {
      return {
        success: false,
        error: VALIDATE_INPUT,
      };
    }

    // If this is a Google login, check if there's an existing email/password account
    if (isGoogleLogin && tokenEmail) {
      // First, check for currently linked accounts
      let linkedAccountSnapshot = await adminDb
        .collection("users")
        .where("googleEmail", "==", tokenEmail)
        .where("googleLinked", "==", true)
        .limit(1)
        .get();

      if (!linkedAccountSnapshot.empty) {
        // Found a linked account
        const linkedDoc = linkedAccountSnapshot.docs[0];
        uid = linkedDoc.id;
        console.log("Google login: Found linked account, using UID:", uid);
      } else {
        // No linked account found, check if there's an email/password account with this email
        // (could be an account that was previously linked but then unlinked)
        const emailAccountSnapshot = await adminDb
          .collection("users")
          .where("email", "==", tokenEmail)
          .limit(1)
          .get();

        if (!emailAccountSnapshot.empty) {
          const emailDoc = emailAccountSnapshot.docs[0];
          const emailData = emailDoc.data();
          
          // If this account was previously linked but is now unlinked, prevent Google login
          if (emailData.googleLinked === false && emailData.googleEmail === null) {
            console.log("Google login blocked: Account was unlinked, must use email/password");
            return {
              success: false,
              error: "This Google account was unlinked. Please sign in with your email and password instead.",
            };
          }
          
          // Otherwise use the email/password account (shouldn't normally happen)
          uid = emailDoc.id;
          console.log("Google login: Found email/password account, using UID:", uid);
        } else {
          // This is a new Google user (no existing account)
          console.log("Google login: No existing account found, new Google user");
        }
      }
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
        email: decodedToken.email || email,
        photoURL: photoURL,
        googleEmail: isGoogleLogin ? decodedToken.email : null,
        googleLinked: isGoogleLogin,
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