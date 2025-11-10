import { NextResponse } from "next/server";
import { adminAuth, adminDb, sendNotification } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    // ตรวจสอบ session cookie (ถ้าใช้)
    const cookieStore = cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userId = decoded.uid;

    const body = await request.json();
    const { taskName, description, category, priorityLevel, deadLine, assignedTo } = body;

    if (!taskName || !category || !deadLine) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const deadlineTimestamp = new Date(deadLine);
    if (isNaN(deadlineTimestamp.getTime())) {
      return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
    }

    const taskData = {
      taskName: taskName.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      priorityLevel: Number(priorityLevel) || 1,
      deadLine: deadlineTimestamp,
      isFinished: false,
      createdAt: FieldValue.serverTimestamp(),
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [userId],
    };

    // บันทึก task ลงใน users/{userId}/tasks หรือ collection ที่คุณใช้
    const taskRef = await adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .add(taskData);

    const newTaskDoc = await taskRef.get();
    const newTask = { id: newTaskDoc.id, ...newTaskDoc.data() };

    // ส่งแจ้งเตือนไปยังผู้ที่ถูกมอบหมาย (assignedTo)
    if (taskData.assignedTo && taskData.assignedTo.length) {
      await Promise.all(
        taskData.assignedTo.map(async (uid: string) => {
          try {
            const uSnap = await adminDb.collection("users").doc(uid).get();
            const token = uSnap.data()?.fcmToken;
            if (token) {
              await sendNotification(
                token,
                "📌 งานใหม่ถูกเพิ่มแล้ว",
                `งาน "${taskName}" ถูกมอบหมายให้คุณ`
              );
            }
          } catch (e) {
            console.warn("notify error for", uid, e);
          }
        })
      );
    }

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding task:", error);
    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to add task", details: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
