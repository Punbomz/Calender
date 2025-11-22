import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { classroomId } = await req.json();

    if (!classroomId) {
      return NextResponse.json(
        { error: "No classroomId provided" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await adminAuth.verifySessionCookie(session, true);

    // ✅ ลบ classroom document อย่างเดียว
    await adminDb.collection("classrooms").doc(classroomId).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
