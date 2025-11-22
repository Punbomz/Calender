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

    const { code } = await req.json(); 

    // หา classroom จาก code
    const q = await adminDb
      .collection("classrooms")
      .where("code", "==", code)
      .get();

    if (q.empty) {
      return NextResponse.json({ error: "ไม่มีห้องเรียนนี้" }, { status: 404 });
    }

    const classroomDoc = q.docs[0];
    const classID = classroomDoc.id;

    // ตรวจสอบว่า student อยู่ในห้องเรียนนี้แล้วหรือไม่
    const existingStudents: string[] = classroomDoc.data().students || [];
    if (existingStudents.includes(studentId)) {
      return NextResponse.json({ 
        error: "คุณอยู่ในห้องเรียนนี้แล้ว",
        alreadyJoined: true 
      }, { status: 200 }); // Changed to 200 so it's treated as success
    }

    // เพิ่ม student เข้า classroom
    await classroomDoc.ref.update({
      students: FieldValue.arrayUnion(studentId),
    });

    // เพิ่ม classroom ให้ student
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

    // ดึงทุก tasks จาก classroom/tasks
    const classroomTasksSnapshot = await adminDb
      .collection("classrooms")
      .doc(classID)
      .collection("tasks")
      .get();

    // คัดลอก tasks ทั้งหมดไปยัง users/{studentId}/tasks
    const copyTasksPromises = classroomTasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = taskDoc.data();
      const taskID = taskDoc.id;

      // สร้าง task ใน users/{studentId}/tasks/{taskID}
      await adminDb
        .collection("users")
        .doc(studentId)
        .collection("tasks")
        .doc(taskID)
        .set({
          ...taskData,
          // เพิ่มข้อมูลว่า task นี้มาจาก classroom
          classroom: classID,
        });
    });

    // รอให้คัดลอก tasks ทั้งหมดเสร็จ
    await Promise.all(copyTasksPromises);

    return NextResponse.json({
      success: true,
      classroomID: classID,
      name: classroomDoc.data().name,
      code: classroomDoc.data().code,
      tasksCount: classroomTasksSnapshot.size,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}