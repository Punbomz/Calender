// app/api/classroom/delete/route.ts
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

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

    console.log(`🗑️ Teacher ${teacherId} attempting to delete classroom: ${classroomId}`);

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

    console.log(`✅ Authorization verified, starting cleanup...`);

    const students = (classroomData?.students as string[]) || [];
    console.log(`👥 Classroom has ${students.length} students`);

    // ========== ลบข้อมูลออกจากนักเรียนทุกคน ==========
    let totalTasksDeleted = 0;

    const cleanupPromises = students.map(async (studentId) => {
      try {
        console.log(`  👤 Cleaning up data for student: ${studentId}`);

        // 1. ลบ classroom ID ออกจาก array ใน user document (สำคัญมาก!)
        await adminDb.collection("users").doc(studentId).update({
          classrooms: FieldValue.arrayRemove(classroomId),
        });
        console.log(`     ✅ Removed from user's classrooms array`);

        // 2. ลบ classroom subcollection document
        await adminDb
          .collection("users")
          .doc(studentId)
          .collection("classrooms")
          .doc(classroomId)
          .delete();
        console.log(`     ✅ Deleted classroom subcollection`);

        // 3. ลบ tasks ทั้งหมดที่เกี่ยวข้องกับห้องเรียนนี้
        const studentTasksRef = adminDb
          .collection("users")
          .doc(studentId)
          .collection("tasks");

        const classroomTasksSnap = await studentTasksRef
          .where("classroom", "==", classroomId)
          .get();

        const taskDeletionPromises = classroomTasksSnap.docs.map(doc => doc.ref.delete());
        await Promise.all(taskDeletionPromises);

        totalTasksDeleted += classroomTasksSnap.size;
        console.log(`     ✅ Deleted ${classroomTasksSnap.size} tasks`);

      } catch (error) {
        console.error(`     ❌ Error cleaning up student ${studentId}:`, error);
      }
    });

    await Promise.all(cleanupPromises);
    console.log(`✅ Cleaned up data for ${students.length} students`);

    // ========== ลบ tasks ทั้งหมดในห้องเรียน ==========
    console.log(`📋 Deleting classroom tasks...`);
    const classroomTasksSnap = await adminDb
      .collection("classrooms")
      .doc(classroomId)
      .collection("tasks")
      .get();

    const deleteTasksPromises = classroomTasksSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteTasksPromises);
    console.log(`✅ Deleted ${classroomTasksSnap.size} classroom tasks`);

    // ========== ลบ classroom document ==========
    await adminDb.collection("classrooms").doc(classroomId).delete();
    console.log(`✅ Deleted classroom document`);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Classroom deletion completed!`);
    console.log(`   - Students cleaned up: ${students.length}`);
    console.log(`   - Total tasks deleted: ${totalTasksDeleted + classroomTasksSnap.size}`);
    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json({
      success: true,
      message: "ลบห้องเรียนสำเร็จ",
      stats: {
        studentsAffected: students.length,
        tasksDeleted: totalTasksDeleted + classroomTasksSnap.size,
      },
    });

  } catch (err) {
    console.error("❌ Error deleting classroom:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';