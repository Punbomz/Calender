import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const studentId = decoded.uid;

    const { code } = await req.json(); // รับรหัสห้องเรียนจาก frontend

    // หา classroom จาก code
    const q = await adminDb
      .collection("classrooms")
      .where("code", "==", code)
      .get();

    if (q.empty) {
      return NextResponse.json(
        { error: "ไม่มีห้องเรียนนี้" },
        { status: 404 }
      );
    }

    const classroomDoc = q.docs[0];
    const classID = classroomDoc.id;

    // ตรวจสอบว่าผู้เรียนยังไม่อยู่ในห้อง
    const existingStudents: string[] = classroomDoc.data().students || [];
    if (existingStudents.includes(studentId)) {
      return NextResponse.json({ error: "คุณอยู่ในห้องเรียนนี้แล้ว" }, { status: 400 });
    }

    // เพิ่ม student เข้าไป
    await classroomDoc.ref.update({
      students: FieldValue.arrayUnion(studentId),
    });

    // เพิ่ม classroom ให้ student (users/{uid}/classrooms/{classID})
    await adminDb
      .collection("users")
      .doc(studentId)
      .collection("classrooms")
      .doc(classID)
      .set({
        joined: true,
        name: classroomDoc.data().name,
        code: classroomDoc.data().code,
        teacher: classroomDoc.data().teacher,
      });

    return NextResponse.json({
      success: true,
      classroomID: classID,
      name: classroomDoc.data().name,
      code: classroomDoc.data().code,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
