import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

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
    const uid = decodedClaims.uid;

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

    // Get the current user
    const currentUser = await adminAuth.getUser(uid);
    
    // Check if Google is already linked
    const hasGoogle = currentUser.providerData.some(
      provider => provider.providerId === "google.com"
    );

    if (hasGoogle) {
      return NextResponse.json(
        { error: "Google account is already linked" },
        { status: 400 }
      );
    }

    // Get current user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const currentData = userDoc.data() || {};

    // Save original data before linking (for restore when unlinking)
    const originalData = {
      displayName: currentData.displayName || currentUser.displayName || null,
      photoURL: currentData.photoURL || currentUser.photoURL || null,
    };

    // Get Google info
    const googleEmail = decodedToken.email;
    const googlePhotoURL = decodedToken.picture;
    const googleDisplayName = decodedToken.name;

    // Update user in Firestore with Google info and save original data
    await adminDb.collection("users").doc(uid).update({
      googleLinked: true,
      googleEmail: googleEmail,
      photoURL: googlePhotoURL || currentData.photoURL,
      displayName: googleDisplayName || currentData.displayName,
      // Save original data for restoration
      originalDisplayName: originalData.displayName,
      originalPhotoURL: originalData.photoURL,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Google account linked successfully",
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
    const uid = decodedClaims.uid;

    // Get current user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data() || {};

    // Prepare update data to restore original values
    const updateData: any = {
      googleLinked: false,
      googleEmail: null,
      updatedAt: new Date().toISOString(),
    };

    // Restore original displayName if it exists
    if (userData.originalDisplayName !== undefined) {
      updateData.displayName = userData.originalDisplayName;
      updateData.originalDisplayName = null; // Clear the backup
    }

    // Restore original photoURL if it exists
    if (userData.originalPhotoURL !== undefined) {
      updateData.photoURL = userData.originalPhotoURL;
      updateData.originalPhotoURL = null; // Clear the backup
    }

    // Update user in Firestore
    await adminDb.collection("users").doc(uid).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Google account unlinked successfully and original data restored",
    });

  } catch (error: any) {
    console.error("Unlink Google error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unlink Google account" },
      { status: 500 }
    );
  }
}