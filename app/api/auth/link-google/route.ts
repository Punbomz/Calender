import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    let uid = decodedClaims.uid;
    const signInProvider = decodedClaims.firebase?.sign_in_provider;

    // IMPORTANT: If logged in with Google, find the linked email/password account
    if (signInProvider === "google.com") {
      const authUser = await adminAuth.getUser(uid);
      const googleEmail = authUser.email;

      // Find the email/password account that has this Google account linked
      const linkedAccountSnapshot = await adminDb
        .collection("users")
        .where("googleEmail", "==", googleEmail)
        .where("googleLinked", "==", true)
        .get();

      if (!linkedAccountSnapshot.empty) {
        // Use the linked email/password account UID
        const linkedDoc = linkedAccountSnapshot.docs[0];
        uid = linkedDoc.id;
        console.log("Link: Found linked account, using UID:", uid);
      }
    }

    // Get the Google ID token from request body
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const googleProviderId = decodedToken.firebase.sign_in_provider;

    // Check if this is a Google sign-in
    if (googleProviderId !== "google.com") {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    // Get the Google email
    const googleEmail = decodedToken.email;

    if (!googleEmail) {
      return NextResponse.json(
        { error: "Google email not found" },
        { status: 400 }
      );
    }

    // Check if this Google email is already linked to a DIFFERENT user
    const existingUserQuery = await adminDb
      .collection("users")
      .where("googleEmail", "==", googleEmail)
      .where("googleLinked", "==", true)
      .get();

    // Check if any OTHER user (not the current user) already has this Google email linked
    const emailAlreadyUsed = existingUserQuery.docs.some(doc => doc.id !== uid);

    if (emailAlreadyUsed) {
      return NextResponse.json(
        { error: "This Google account is already linked to another user" },
        { status: 400 }
      );
    }

    // Check if the Google email matches an existing email/password account (different from current user)
    const emailAccountQuery = await adminDb
      .collection("users")
      .where("email", "==", googleEmail)
      .get();

    const emailAccountExists = emailAccountQuery.docs.some(doc => doc.id !== uid);

    if (emailAccountExists) {
      return NextResponse.json(
        { error: "This email is already registered with another account" },
        { status: 400 }
      );
    }

    // Get current user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const currentData = userDoc.data() || {};

    // Check if Google is already linked for this user
    if (currentData.googleLinked) {
      return NextResponse.json(
        { error: "Google account is already linked" },
        { status: 400 }
      );
    }

    // Get Google info
    const googlePhotoURL = decodedToken.picture;
    const googleDisplayName = decodedToken.name;

    // Prepare update data - ONLY save original data and link status
    // DO NOT overwrite user's existing displayName and photoURL
    const updateData: any = {
      googleLinked: true,
      googleEmail: googleEmail,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Save original data ONLY if not already saved (first time linking)
    if (!currentData.originalDisplayName && currentData.displayName) {
      updateData.originalDisplayName = currentData.displayName;
    }
    if (!currentData.originalPhotoURL && currentData.photoURL) {
      updateData.originalPhotoURL = currentData.photoURL;
    }

    // Store Google's name and photo separately for reference, but don't apply them
    // User can manually choose to use them if they want
    updateData.googleDisplayName = googleDisplayName || null;
    updateData.googlePhotoURL = googlePhotoURL || null;

    // Update user in Firestore (just update the current user document)
    await adminDb.collection("users").doc(uid).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Google account linked successfully",
      googleInfo: {
        displayName: googleDisplayName,
        photoURL: googlePhotoURL,
        email: googleEmail
      }
    });

  } catch (error: any) {
    console.error("Link Google error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to link Google account" },
      { status: 500 }
  );
  }
}

// API to unlink Google account and restore original data
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    let uid = decodedClaims.uid;
    const signInProvider = decodedClaims.firebase?.sign_in_provider;
    const isLoggedInWithGoogle = signInProvider === "google.com";
    let emailPasswordUid = uid;

    // If logged in with Google, find the linked email/password account
    if (isLoggedInWithGoogle) {
      const authUser = await adminAuth.getUser(uid);
      const googleEmail = authUser.email;

      // Find the email/password account that has this Google account linked
      const linkedAccountSnapshot = await adminDb
        .collection("users")
        .where("googleEmail", "==", googleEmail)
        .where("googleLinked", "==", true)
        .get();

      if (!linkedAccountSnapshot.empty) {
        // Use the linked email/password account UID
        const linkedDoc = linkedAccountSnapshot.docs[0];
        emailPasswordUid = linkedDoc.id;
        console.log("Unlink: Found linked account, using UID:", emailPasswordUid);
      } else {
        return NextResponse.json(
          { error: "No linked account found" },
          { status: 400 }
        );
      }
    }

    // Get current user data from Firestore
    const userDoc = await adminDb.collection("users").doc(emailPasswordUid).get();
    const userData = userDoc.data() || {};

    // Check if Google is actually linked
    if (!userData.googleLinked) {
      return NextResponse.json(
        { error: "No Google account is linked" },
        { status: 400 }
      );
    }

    // Prepare update data to unlink Google
    const updateData: any = {
      googleLinked: false,
      googleEmail: null,
      googleDisplayName: null,
      googlePhotoURL: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update user in Firestore
    await adminDb.collection("users").doc(emailPasswordUid).update(updateData);

    // If user was logged in with Google, we need to create a new session with the email/password UID
    if (isLoggedInWithGoogle) {
      try {
        // Get the email/password user from Firebase Auth
        const emailPasswordAuthUser = await adminAuth.getUser(emailPasswordUid);
        
        // Create a custom token for the email/password account
        const customToken = await adminAuth.createCustomToken(emailPasswordUid);
        
        return NextResponse.json({
          success: true,
          message: "Google account unlinked successfully. Switching to email/password session.",
          requiresReauth: true,
          customToken: customToken, // Send token to frontend to create new session
        });
      } catch (tokenError) {
        console.error("Error creating custom token:", tokenError);
        // Fallback: just log them out
        cookieStore.delete("session");
        return NextResponse.json({
          success: true,
          message: "Google account unlinked successfully. Please sign in with your email and password.",
          requiresReauth: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Google account unlinked successfully",
      requiresReauth: false,
    });

  } catch (error: any) {
    console.error("Unlink Google error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unlink Google account" },
      { status: 500 }
    );
  }
}