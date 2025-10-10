import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (session) {
      try {
        // Revoke the session
        const decodedClaims = await adminAuth.verifySessionCookie(session.value);
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch (error) {
        console.error("Error revoking session:", error);
        // Continue to delete cookie even if revoke fails
      }
    }

    // Clear the session cookie
    cookieStore.delete("session");

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    
    // Still try to clear cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Logout failed",
      },
      { status: 500 }
    );
  }
}