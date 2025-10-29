// app/api/task/addtask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

// POST - Add new task
export async function POST(request: NextRequest) {
  try {
    // 1. ตรวจสอบ session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    // 2. Verify session และดึง userId
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    // 3. รับข้อมูลจาก request body
    const body = await request.json();
    const { taskName, description, category, priorityLevel, deadLine, isFinished } = body;

    // 4. Validate required fields
    if (!taskName || !category || !deadLine) {
      return NextResponse.json(
        { error: "Missing required fields: taskName, category, deadLine" },
        { status: 400 }
      );
    }

    // 5. แปลง deadLine เป็น Firestore Timestamp
    let deadlineTimestamp;
    try {
      deadlineTimestamp = new Date(deadLine);
      if (isNaN(deadlineTimestamp.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid deadline format" },
        { status: 400 }
      );
    }

    // 6. สร้าง task object
    const taskData = {
      taskName: taskName.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      priorityLevel: Number(priorityLevel) || 1,
      deadLine: deadlineTimestamp,
      isFinished: isFinished || false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 7. เพิ่ม task เข้า Firestore
    const taskRef = await adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .add(taskData);

    // 8. ดึงข้อมูล task ที่เพิ่งสร้าง
    const newTaskDoc = await taskRef.get();
    const newTask = {
      id: newTaskDoc.id,
      ...newTaskDoc.data(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Task added successfully",
        task: newTask,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error adding task:", error);
    
    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add task", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';