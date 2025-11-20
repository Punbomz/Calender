import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// ฟังก์ชันสร้างรหัสห้องเรียนสุ่ม
function generateRandomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ฟังก์ชันสร้างรหัสไม่ซ้ำ
async function generateUniqueCode() {
  let code = generateRandomCode();
  const classroomsRef = adminDb.collection("classrooms");
  let snapshot = await classroomsRef.where("code", "==", code).get();

  // ถ้าซ้ำ ให้สุ่มใหม่
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

    const { name } = await req.json(); // รับชื่อห้องจาก frontend
    const code = await generateUniqueCode(); // สร้างรหัสห้องเรียน

    const newClassRef = adminDb.collection("classrooms").doc();

    await newClassRef.set({
      name,
      code,
      teacher: teacherId,
      students: [], // เริ่มต้นว่าง
      tasks: [],    // เริ่มต้นว่าง
      classroomID: newClassRef.id,
    });

    // เพิ่ม classroom ให้ teacher
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
