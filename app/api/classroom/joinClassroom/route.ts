// app/api/classroom/join/route.ts
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

    console.log(`📚 Student ${studentId} attempting to join classroom with code: ${code}`);

    // หา classroom จาก code
    const q = await adminDb
      .collection("classrooms")
      .where("code", "==", code)
      .get();

    if (q.empty) {
      console.log(`❌ Classroom not found with code: ${code}`);
      return NextResponse.json({ error: "ไม่มีห้องเรียนนี้" }, { status: 404 });
    }

    const classroomDoc = q.docs[0];
    const classID = classroomDoc.id;
    
    console.log(`✅ Found classroom: ${classID} (${classroomDoc.data().name})`);

    // ตรวจสอบว่า student อยู่ในห้องเรียนนี้แล้วหรือไม่
    const existingStudents: string[] = classroomDoc.data().students || [];
    if (existingStudents.includes(studentId)) {
      console.log(`ℹ️ Student already in classroom`);
      return NextResponse.json({ 
        error: "คุณอยู่ในห้องเรียนนี้แล้ว",
        alreadyJoined: true 
      }, { status: 200 });
    }

    // เพิ่ม student เข้า classroom
    await classroomDoc.ref.update({
      students: FieldValue.arrayUnion(studentId),
    });
    console.log(`✅ Added student to classroom's students array`);

    // เพิ่ม classroom ID ให้ student's user document (NOT subcollection!)
    const userRef = adminDb.collection("users").doc(studentId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const currentClassrooms = (userData?.classrooms as string[]) || [];
    
    if (!currentClassrooms.includes(classID)) {
      await userRef.update({
        classrooms: FieldValue.arrayUnion(classID),
      });
      console.log(`✅ Added classroom ID to user's classrooms array`);
    }

    // เพิ่ม classroom info ให้ student subcollection (for quick reference)
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
        joinedAt: new Date().toISOString(),
      });
    console.log(`✅ Created classroom reference in user's classrooms subcollection`);

    // ดึงทุก tasks จาก classroom/tasks
    const classroomTasksSnapshot = await adminDb
      .collection("classrooms")
      .doc(classID)
      .collection("tasks")
      .get();

    console.log(`📋 Found ${classroomTasksSnapshot.size} tasks in classroom`);

    // คัดลอก tasks ทั้งหมดไปยัง users/{studentId}/tasks
    const copyTasksPromises = classroomTasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = taskDoc.data();
      const classroomTaskId = taskDoc.id; // This is the original task ID in the classroom

      console.log(`  📝 Copying task: ${taskData.taskName} (ID: ${classroomTaskId})`);

      // สร้าง task ใน users/{studentId}/tasks
      // ⚠️ IMPORTANT: Use .add() to create a NEW document with auto-generated ID
      // and store the classroomTaskId to link back to the original task
      await adminDb
        .collection("users")
        .doc(studentId)
        .collection("tasks")
        .add({
          taskName: taskData.taskName,
          description: taskData.description || "",
          deadLine: taskData.deadLine,
          category: taskData.category || "Homework",
          priorityLevel: 1,
          classroom: classID, // Which classroom this task belongs to
          classroomTaskId: classroomTaskId, // ⭐ CRITICAL: Link to original classroom task
          isFinished: false,
          createdAt: taskData.createdAt || new Date().toISOString(),
          attachments: taskData.files || [],
        });
    });

    // รอให้คัดลอก tasks ทั้งหมดเสร็จ
    await Promise.all(copyTasksPromises);
    console.log(`✅ Copied all ${classroomTasksSnapshot.size} tasks to student`);

    return NextResponse.json({
      success: true,
      classroomID: classID,
      name: classroomDoc.data().name,
      code: classroomDoc.data().code,
      tasksCount: classroomTasksSnapshot.size,
    });
  } catch (err) {
    console.error("❌ Error joining classroom:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';