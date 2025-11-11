// app/api/task/updatetask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // Parse form data
    const formData = await request.formData();
    const taskId = formData.get("taskId") as string | null;
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
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
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const existingData = taskDoc.data() || {};
    const updates: any ={};

    const taskName = formData.get("taskName") as string | null;
    if (taskName !== null) {
      updates.taskName = taskName.trim();
    }

    const description = formData.get("description") as string | null;
    if (description !== null) {
      updates.description = description.trim();
    }

    const category = formData.get("category") as string | null;
    if (category !== null) {
      updates.category = category.trim();
    } else {
      updates.category = "";
    }

    const priorityLevel = formData.get("priorityLevel") as string | null;
    if (priorityLevel !== null) {
      const num = Number(priorityLevel);
      if (!Number.isNaN(num)) {
        updates.priorityLevel = num;
      }
    }

    const deadLine = formData.get("deadLine") as string | null;
    if (deadLine !== null) {
      const d = new Date(deadLine);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid deadline format" },
          { status: 400 }
        );
      }
      updates.deadLine = d;
    }

    const files = formData
      .getAll("files") 
      .filter((f) => f instanceof File) as File[];
    if (files.length > 0) {
      const storage = getStorage();
      // FIX: Specify bucket name explicitly
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = storage.bucket(bucketName);
      
      console.log('📦 Using storage bucket:', bucketName);
      const newAttachmentUrls: string[] = [];

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = file.name.replace(/\s+/g, "_");
        const filePath = `tasks/${userId}/${Date.now()}-${safeName}`;
        const fileRef = bucket.file(filePath);
        await fileRef.save(buffer, {
          metadata: { 
            contentType: file.type || "application/octet-stream",
          },
          resumable: false,
        });

        // Make file publicly accessible (optional)
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        newAttachmentUrls.push(publicUrl);
      }

      const existingAttachments = Array.isArray(existingData.attachments)
        ? existingData.attachments
        : [];

      updates.attachments = [...existingAttachments, ...newAttachmentUrls];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No update data provided" },
        { status: 400 }
      );
    }

    updates.updatedAt = FieldValue.serverTimestamp();

    await taskRef.update(updates);

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
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}