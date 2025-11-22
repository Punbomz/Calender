import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// สร้างรหัสสุ่ม
function generateRandomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ตรวจสอบไม่ให้รหัสซ้ำ
async function generateUniqueCode() {
  let code = generateRandomCode();
  const classroomsRef = adminDb.collection("classrooms");
  let snapshot = await classroomsRef.where("code", "==", code).get();

  while (!snapshot.empty) {
    code = generateRandomCode();
    snapshot = await classroomsRef.where("code", "==", code).get();
  }

  return code;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const teacherId = decoded.uid;

    const { name } = await req.json();
    const code = await generateUniqueCode();

    const newClassRef = adminDb.collection("classrooms").doc();

    await newClassRef.set({
      name,
      code,
      teacher: teacherId,
      students: [],
      tasks: [],
      classroomID: newClassRef.id,
    });

    // ผูก classroom ให้ teacher
    await adminDb
      .collection("users")
      .doc(teacherId)
      .collection("classrooms")
      .doc(newClassRef.id)
      .set({ joined: true });

    return NextResponse.json({
      success: true,
      classroomID: newClassRef.id,
      code,
      name,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
