import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Verifies the session and returns the user's UID
 * If logged in with Google and account is linked, returns the original email/password account UID
 */
export async function getVerifiedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  
  if (!session) {
    redirect("/login");
  }

  try {
    // Verify session and get user data
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    let uid = decodedClaims.uid;

    // Get user info from Firebase Auth
    const authUser = await adminAuth.getUser(uid);
    const signInProvider = decodedClaims.firebase?.sign_in_provider;

    // If logged in with Google, check if this is a linked account
    if (signInProvider === "google.com") {
      const googleEmail = authUser.email;
      
      // Find the original email/password account that linked this Google account
      // Search by googleEmail field instead of googleUid
      const linkedAccountSnapshot = await adminDb
        .collection("users")
        .where("googleEmail", "==", googleEmail)
        .where("googleLinked", "==", true)
        .get();

      if (!linkedAccountSnapshot.empty) {
        // Found the linked account, use that UID instead
        const linkedDoc = linkedAccountSnapshot.docs[0];
        uid = linkedDoc.id;
      }
    }

    return uid;
  } catch (error) {
    console.error("Session verification error:", error);
    redirect("/login");
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
      redirect("/login");
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    const signInProvider = decodedClaims.firebase?.sign_in_provider;

    // Get user info from Firebase Auth
    const authUser = await adminAuth.getUser(uid);

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    // Check if user signed in with Google
    const hasGoogleProvider = authUser.providerData.some(
      provider => provider.providerId === "google.com"
    );
    const isGoogleSignIn = signInProvider === "google.com" || hasGoogleProvider;

    // Check if Google is linked (for non-Google sign-in users)
    const isGoogleLinked = userData?.googleLinked || false;
    const googleEmail = userData?.googleEmail || null;

    return {
      authUser,
      userData,
      isGoogleSignIn,
      isGoogleLinked,
      googleEmail,
      signInProvider
    };
  } catch (error) {
    console.error("Get user data error:", error);
    redirect("/login");
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