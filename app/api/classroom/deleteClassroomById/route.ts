import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { classroomId } = await req.json();

    if (!classroomId) {
      return NextResponse.json({ error: "No classroomId provided" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const teacherId = decoded.uid;

    // ดึงข้อมูล classroom
    const classroomDoc = await adminDb
      .collection("classrooms")
      .doc(classroomId)
      .get();

    if (!classroomDoc.exists) {
      return NextResponse.json({ error: "ไม่พบห้องเรียนนี้" }, { status: 404 });
    }

    const classroomData = classroomDoc.data();

    // ตรวจสอบว่าเป็นครูของห้องเรียนนี้หรือไม่
    if (classroomData?.teacher !== teacherId) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ลบห้องเรียนนี้" }, { status: 403 });
    }

    // ✅ ลบ classroom document อย่างเดียว
    await adminDb.collection("classrooms").doc(classroomId).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
