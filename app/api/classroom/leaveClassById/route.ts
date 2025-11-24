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

    const { classroomId } = await req.json();

    if (!classroomId) {
      return NextResponse.json(
        { error: "No classroomId provided" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า classroom มีอยู่จริง
    const classroomDoc = await adminDb
      .collection("classrooms")
      .doc(classroomId)
      .get();

    if (!classroomDoc.exists) {
      return NextResponse.json(
        { error: "ไม่พบห้องเรียนนี้" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า student อยู่ในห้องเรียนจริงหรือไม่
    const existingStudents: string[] = classroomDoc.data()?.students || [];
    if (!existingStudents.includes(studentId)) {
      return NextResponse.json(
        { error: "คุณไม่ได้อยู่ในห้องเรียนนี้" },
        { status: 400 }
      );
    }

    // 1. ลบ studentId ออกจาก students array ใน classroom
    await classroomDoc.ref.update({
      students: FieldValue.arrayRemove(studentId),
    });

    // 2. ลบ classroom document จาก users/{studentId}/classrooms/{classroomId}
    await adminDb
      .collection("users")
      .doc(studentId)
      .collection("classrooms")
      .doc(classroomId)
      .delete();

    // 3. ดึง tasks ทั้งหมดที่มี classroom field = classroomId
    const studentTasksSnapshot = await adminDb
      .collection("users")
      .doc(studentId)
      .collection("tasks")
      .where("classroom", "==", classroomId)
      .get();

    // 4. ลบ tasks ทั้งหมดที่เกี่ยวข้องกับ classroom นี้
    const deleteTasksPromises = studentTasksSnapshot.docs.map(async (taskDoc) => {
      await taskDoc.ref.delete();
    });

    await Promise.all(deleteTasksPromises);

    return NextResponse.json({
      success: true,
      message: "ออกจากห้องเรียนสำเร็จ",
      deletedTasksCount: studentTasksSnapshot.size,
    });
  } catch (err: any) {
    console.error("Leave classroom error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}