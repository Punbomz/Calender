import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com";

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decoded.uid;

    const form = await req.formData();
    const taskId = form.get("taskId") as string;

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const taskRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .doc(taskId);

    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Get form values
    const taskName = form.get("taskName") as string | null;
    const description = form.get("description") as string | null;
    const priorityLevel = form.get("priorityLevel") as string | null;
    const category = form.get("category") as string | null;
    const deadLine = form.get("deadLine") as string | null;
    const isFinishedValue = form.get("isFinished");

    console.log("Received form data:", {
      taskId,
      taskName,
      description,
      priorityLevel,
      category,
      deadLine,
      isFinished: isFinishedValue
    });

    // Update fields with Firestore field names
    if (taskName !== null && taskName !== undefined) {
      const trimmed = taskName.trim();
      if (trimmed) updateData.taskName = trimmed;
    }

    if (description !== null && description !== undefined) {
      updateData.description = description.trim();
    }

    if (priorityLevel !== null && priorityLevel !== undefined) {
      const priority = Number(priorityLevel);
      if (!isNaN(priority)) {
        updateData.priorityLevel = priority;
      }
    }

    if (category !== null && category !== undefined) {
      updateData.category = category;
    }

    if (deadLine !== null && deadLine !== undefined) {
      try {
        const deadlineDate = new Date(deadLine);
        if (!isNaN(deadlineDate.getTime())) {
          updateData.deadLine = deadlineDate;
        }
      } catch (err) {
        console.error("Invalid deadline format:", err);
      }
    }

    if (isFinishedValue !== null && isFinishedValue !== undefined) {
      const isFinishedBool = String(isFinishedValue).toLowerCase() === "true";
      updateData.isFinished = isFinishedBool;
      console.log("Setting isFinished to:", updateData.isFinished);
    }

    const bucket = adminStorage.bucket(BUCKET_NAME);
    const newFiles = form.getAll("files") as File[];
    const deleteFiles = form.getAll("deleteFiles") as string[];

    // Delete marked files
    if (deleteFiles.length > 0) {
      for (const url of deleteFiles) {
        try {
          const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
          await bucket.file(path).delete();
        } catch (err) {
          console.warn("Failed to delete file:", url, err);
        }
      }
      updateData.attachments = FieldValue.arrayRemove(...deleteFiles);
    }

    // Upload new files
    const uploadedUrls: string[] = [];
    for (const file of newFiles) {
      if (file.size === 0) continue;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileId = uuidv4();
      const filePath = `tasks/${userId}/${taskId}/${fileId}-${file.name}`;
      const uploadedFile = bucket.file(filePath);

      await uploadedFile.save(buffer, {
        contentType: file.type,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length > 0) {
      updateData.attachments = FieldValue.arrayUnion(...uploadedUrls);
    }

    console.log("Applying update:", updateData);
    await taskRef.update(updateData);

    const updatedTaskDoc = await taskRef.get();
    const updatedTaskData = updatedTaskDoc.data();

    console.log("Task updated successfully");

    return NextResponse.json({
      success: true,
      task: updatedTaskData,
    });
  } catch (err: any) {
    console.error("Update failed:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}