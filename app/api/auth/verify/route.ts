import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    // ❌ ไม่มี session
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ✅ ตรวจสอบ session token จาก Firebase
    const decoded = await adminAuth.verifySessionCookie(session, true);

    // สำเร็จ → ตอบกลับข้อมูลผู้ใช้
    return NextResponse.json(
      { message: "Authorized", uid: decoded.uid, email: decoded.email },
      { status: 200 }
    );
  } catch (error) {
    // ❌ session ไม่ถูกต้องหรือหมดอายุ
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
