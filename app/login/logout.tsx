"use server";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { LOGOUT_COMPLETE, LOGOUT_FAILED } from "./loginConstant"

interface LoginResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export async function logoutUser(): Promise<LoginResponse> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (session) {
      // Revoke the session
      const decodedClaims = await adminAuth.verifySessionCookie(session.value);
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    }

    // Clear the session cookie
    (await cookies()).delete("session");

    return {
      success: true,
      message: LOGOUT_COMPLETE,
    };
  } catch (error: any) {
    console.error("Logout error:", error);
    // Still clear the cookie even if there's an error
    (await cookies()).delete("session");
    
    return {
      success: false,
      error: LOGOUT_FAILED,
    };
  }
}