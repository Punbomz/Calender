import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken || body.token;
    const provider = body.provider;

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const signInProvider = decodedToken.firebase.sign_in_provider;

    // Check if this is a Google login
    const isGoogleLogin = signInProvider === "google.com" || provider === "google";

    if (isGoogleLogin && email) {
      // Check if there's an existing email/password account with this email that has linked this Google account
      const usersSnapshot = await adminDb
        .collection("users")
        .where("email", "==", email)
        .where("googleLinked", "==", true)
        .where("googleUid", "==", uid)
        .get();

      if (!usersSnapshot.empty) {
        // Found existing account that has linked this Google account
        const existingUserDoc = usersSnapshot.docs[0];
        const existingUid = existingUserDoc.id;

        // Create session cookie with the existing (email/password) account UID
        // Note: We can't create a session cookie with different UID than the token
        // So we need to return the correct UID and handle this on the client side
        
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
          expiresIn,
        });

        const cookieStore = await cookies();
        cookieStore.set("session", sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
        });

        // Also set a custom claim or additional cookie to indicate the linked account
        cookieStore.set("linked_uid", existingUid, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
        });

        return NextResponse.json({
          success: true,
          message: "Login successful with linked Google account",
          uid: existingUid,
          linkedAccount: true,
        });
      }

      // Check if there's an account with this email but not linked
      const unlinkedSnapshot = await adminDb
        .collection("users")
        .where("email", "==", email)
        .get();

      if (!unlinkedSnapshot.empty) {
        // Check if any of these accounts have googleLinked = false or googleUid different
        for (const doc of unlinkedSnapshot.docs) {
          const data = doc.data();
          if (!data.googleLinked || data.googleUid !== uid) {
            return NextResponse.json(
              { 
                error: "EMAIL_EXISTS_NOT_LINKED",
                message: "An account with this email already exists. Please login with email/password and link your Google account first.",
                existingEmail: email
              },
              { status: 403 }
            );
          }
        }
      }

      // No existing account, this is a new Google user
      // Create new user document
      await adminDb.collection("users").doc(uid).set({
        email: email,
        displayName: decodedToken.name || email?.split('@')[0] || "User",
        photoURL: decodedToken.picture || null,
        googleLinked: true,
        googleEmail: email,
        googleUid: uid,
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Create session cookie (for email login or valid Google user)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      uid: uid,
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}