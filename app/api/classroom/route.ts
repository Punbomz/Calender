import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin"; 
import { sendNotificationToStudents } from "@/lib/notification";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const classroomRef = await adminDb.collection("classrooms").add({
      name: data.name,
      teacherId: data.teacherId,
      createdAt: new Date(), 
    });

    const classroom = {
      id: classroomRef.id,
      name: data.name,
    };

    const studentsSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "STUDENT")
      .get();

    // แก้จุดที่แดง: เติม : any ให้ doc เพื่อบอก TypeScript ว่า "ยอมรับข้อมูลนี้เถอะ"
    const students = studentsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    await sendNotificationToStudents(students as any, classroom);

    return NextResponse.json({ ok: true, classroom });

  } catch (error) {
    console.error("Error creating classroom:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create classroom" }, 
      { status: 500 }
    );
  }
}