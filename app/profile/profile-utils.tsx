import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Verifies the session and returns the user's UID
 * If logged in with Google and account is linked, returns the original email/password account UID
 */
export async function getVerifiedUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    
    if (!session) {
      console.log("No session found, redirecting to login");
      redirect("/login");
    }

    console.log("Verifying session cookie...");
    // Verify session and get user data
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    let uid = decodedClaims.uid;
    console.log("Session verified for UID:", uid);

    // Get user info from Firebase Auth
    const authUser = await adminAuth.getUser(uid);
    const signInProvider = decodedClaims.firebase?.sign_in_provider;
    console.log("Sign-in provider:", signInProvider);

    // If logged in with Google, check if this is a linked account
    if (signInProvider === "google.com") {
      const googleEmail = authUser.email?.toLowerCase(); // Normalize email
      console.log("Google sign-in detected, checking for linked account with email:", googleEmail);
      
      if (!googleEmail) {
        console.log("No email found in Google auth user");
        cookieStore.delete("session");
        redirect("/login");
      }
      
      // Try to find account by googleEmail field first (currently linked)
      let linkedAccountSnapshot = await adminDb
        .collection("users")
        .where("googleEmail", "==", googleEmail)
        .where("googleLinked", "==", true)
        .limit(1)
        .get();

      if (!linkedAccountSnapshot.empty) {
        // Found a linked account
        const linkedDoc = linkedAccountSnapshot.docs[0];
        uid = linkedDoc.id;
        console.log("Found linked account by googleEmail, using UID:", uid);
      } else {
        // Not found by googleEmail, try searching by email field
        linkedAccountSnapshot = await adminDb
          .collection("users")
          .where("email", "==", googleEmail)
          .limit(1)
          .get();

        if (!linkedAccountSnapshot.empty) {
          const linkedDoc = linkedAccountSnapshot.docs[0];
          const linkedData = linkedDoc.data();
          
          console.log("Found account by email field:", {
            uid: linkedDoc.id,
            googleLinked: linkedData.googleLinked,
            googleEmail: linkedData.googleEmail
          });
          
          // If the account was unlinked AND user is logged in via Google auth, redirect
          // This prevents Google-authenticated users from accessing an unlinked account
          if (linkedData.googleLinked === false && uid !== linkedDoc.id) {
            console.log("Google account was unlinked and user is authenticated via Google, redirecting");
            cookieStore.delete("session");
            redirect("/login");
          }
          
          // If still linked, use the email/password UID
          if (linkedData.googleLinked === true && linkedData.googleEmail) {
            uid = linkedDoc.id;
            console.log("Found linked account by email, using UID:", uid);
          }
        } else {
          console.log("No linked account found by email, using Google UID:", uid);
        }
      }
    }

    return uid;
  } catch (error: any) {
    console.error("Error in getVerifiedUserId:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Gets complete user data from both Firebase Auth and Firestore
 */
export async function getUserData(uid: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    
    if (!session) {
      console.log("No session in getUserData");
      redirect("/login");
    }

    console.log("Getting user data for UID:", uid);
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const signInProvider = decodedClaims.firebase?.sign_in_provider;
    const tokenUid = decodedClaims.uid;

    // Get user info from Firebase Auth
    const authUser = await adminAuth.getUser(uid);
    console.log("Got auth user:", authUser.uid);

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      console.error("User document not found in Firestore for UID:", uid);
      throw new Error("User data not found");
    }
    
    const userData = userDoc.data();
    console.log("Got user data from Firestore");

    // IMPORTANT: Determine if this is truly a Google-only sign-in
    // If the token UID is different from the profile UID, it means:
    // - User logged in with Google (tokenUid = Google UID)
    // - But we're showing linked email/password account (uid = email/password UID)
    // In this case, it's a LINKED account, not a pure Google sign-in
    const isLinkedAccountSession = signInProvider === "google.com" && tokenUid !== uid;
    
    // Check if Google is linked (from Firestore data)
    const isGoogleLinked = userData?.googleLinked || false;
    const googleEmail = userData?.googleEmail || null;

    // isGoogleSignIn should only be true if:
    // 1. User signed in with Google AND
    // 2. This is NOT a linked account session (they're using pure Google account)
    const isGoogleSignIn = signInProvider === "google.com" && !isLinkedAccountSession;

    console.log("Auth check:", {
      signInProvider,
      tokenUid,
      profileUid: uid,
      isLinkedAccountSession,
      isGoogleSignIn,
      isGoogleLinked
    });

    return {
      authUser,
      userData,
      isGoogleSignIn,
      isGoogleLinked,
      googleEmail,
      signInProvider
    };
  } catch (error: any) {
    console.error("Error in getUserData:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Gets display name for the user
 */
export function getDisplayName(userData: any, authUser: any): string {
  return userData?.name || 
         userData?.displayName || 
         authUser.displayName || 
         userData?.email?.split('@')[0] || 
         "User";
}

/**
 * Gets full name for the user
 */
export function getFullName(userData: any, authUser: any): string {
  return userData?.name || 
         userData?.displayName || 
         authUser.displayName || 
         "Not set";
}

/**
 * Gets email for the user
 */
export function getEmail(userData: any, authUser: any): string {
  return userData?.email || authUser.email || "N/A";
}

/**
 * Gets photo URL for the user
 */
export function getPhotoURL(userData: any, authUser: any): string | null {
  return userData?.photoURL || authUser.photoURL || null;
}

/**
 * Handles user logout
 */
export async function handleLogout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}