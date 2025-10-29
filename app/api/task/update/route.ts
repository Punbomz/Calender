// app/api/task/updatetask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// PATCH - Update a task
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { taskId, ...updateData } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    const taskRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .doc(taskId);

    // Check if task exists
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update the task with timestamp
    const updatePayload = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await taskRef.update(updatePayload);

    // Fetch the updated task
    const updatedTaskDoc = await taskRef.get();
    const updatedTask = {
      id: updatedTaskDoc.id,
      ...updatedTaskDoc.data(),
    };

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("Error updating task:", error);

    if (error.code === "auth/session-cookie-expired") {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
