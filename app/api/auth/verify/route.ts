// app/api/auth/verify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);

    console.log("✅ Verified UID:", decoded.uid);

    return NextResponse.json({
      success: true,
      uid: decoded.uid,
      email: decoded.email,
    });
  } catch (error: any) {
    console.error("❌ Verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

