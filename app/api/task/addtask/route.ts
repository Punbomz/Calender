// app/api/task/addtask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No session found" },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    const formData = await request.formData();

    const taskNameRaw =
      (formData.get("taskName") as string | null) ||
      (formData.get("title") as string | null);
    const descriptionRaw =
      (formData.get("description") as string | null) || "";
    const categoryRaw =
      (formData.get("category") as string | null) || "";
    const priorityRaw =
      (formData.get("priorityLevel") as string | null) ||
      (formData.get("priority") as string | null) ||
      "1";
    const deadlineRaw =
      (formData.get("deadLine") as string | null) ||
      (formData.get("deadline") as string | null);

    if (!taskNameRaw || !deadlineRaw) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: taskName, category, deadLine" },
        { status: 400 }
      );
    }

    let deadlineTimestamp: Date;
    try {
      deadlineTimestamp = new Date(deadlineRaw);
      if (isNaN(deadlineTimestamp.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid deadline format" },
        { status: 400 }
      );
    }

    const files = formData.getAll("files");
    const attachmentUrls: string[] = [];

    if (files && files.length > 0) {
      const storage = getStorage();
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = storage.bucket(bucketName);

      for (const file of files) {
        if (!(file instanceof File)) continue;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeName = file.name.replace(/\s+/g, "_");
        const id = uuidv4();
        const filePath = `tasks/${userId}/${Date.now()}-${id}-${safeName}`;

        const fileRef = bucket.file(filePath);

        await fileRef.save(buffer, {
          resumable: false,
          metadata: {
            contentType: file.type || "application/octet-stream",
            metadata: {
              firebaseStorageDownloadTokens: id
            }
          },
        });

        // --- 🔥 Correct public URL ---
        const publicUrl =
          `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${id}`;

        attachmentUrls.push(publicUrl);
      }
    }

    const taskData = {
      taskName: taskNameRaw.trim(),
      description: descriptionRaw.trim(),
      category: categoryRaw.trim(),
      priorityLevel: Number(priorityRaw) || 1,
      deadLine: deadlineTimestamp,
      isFinished: false,
      createdAt: FieldValue.serverTimestamp(),
      attachments: attachmentUrls,
    };

    const taskRef = await adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .add(taskData);

    const newTaskDoc = await taskRef.get();
    const newTask = { id: newTaskDoc.id, ...newTaskDoc.data() };

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
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add task", details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
