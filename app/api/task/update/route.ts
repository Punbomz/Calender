import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getStorage } from "firebase-admin/storage";

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

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

    // --------------------------------------------
    // Update base task fields
    // --------------------------------------------
    const updateData: any = {
      updatedAt: new Date(),
    };

    const taskName = form.get("taskName") as string | null;
    const description = form.get("description") as string | null;
    const priorityLevel = form.get("priorityLevel") as string | null;
    const category = form.get("category") as string | null;
    const deadLine = form.get("deadLine") as string | null;
    const isFinishedValue = form.get("isFinished");

    if (taskName) updateData.taskName = taskName.trim();
    if (description) updateData.description = description.trim();

    if (priorityLevel) {
      const p = Number(priorityLevel);
      if (!isNaN(p)) updateData.priorityLevel = p;
    }

    if (category) updateData.category = category;

    if (deadLine) {
      const d = new Date(deadLine);
      if (!isNaN(d.getTime())) updateData.deadLine = d;
    }

    if (isFinishedValue !== null && isFinishedValue !== undefined) {
      updateData.isFinished = String(isFinishedValue).toLowerCase() === "true";
    }

    // Apply field updates (not attachments yet)
    await taskRef.update(updateData);

    // --------------------------------------------
    // Handle attachments
    // --------------------------------------------
    const storage = getStorage();
    const bucket = storage.bucket(BUCKET_NAME);

    const deleteFiles = form.getAll("deleteFiles") as string[];
    const newFiles = form.getAll("files") as File[];

    // --------------------------------------------
    // 1️⃣ REMOVE old attachments (DB + storage)
    // --------------------------------------------
    if (deleteFiles.length > 0) {
      // Firestore remove
      await taskRef.update({
        attachments: FieldValue.arrayRemove(...deleteFiles),
      });

      // Storage delete
      for (const url of deleteFiles) {
        try {
          const cleanPath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
          await bucket.file(cleanPath).delete();
        } catch (err) {
          console.warn("Failed to delete storage file:", url, err);
        }
      }
    }

    // --------------------------------------------
    // 2️⃣ UPLOAD new attachments (DB + storage)
    // --------------------------------------------
    const uploadedUrls: string[] = [];

    for (const file of newFiles) {
      if (!(file instanceof File)) continue;
      if (file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const token = uuidv4();

      const safeName = file.name.replace(/\s+/g, "_");
      const filePath = `tasks/${userId}/${taskId}/${Date.now()}-${token}-${safeName}`;
      const fileRef = bucket.file(filePath);

      await fileRef.save(buffer, {
        resumable: false,
        metadata: {
          contentType: file.type || "application/octet-stream",
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      });

      const publicUrl =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length > 0) {
      await taskRef.update({
        attachments: FieldValue.arrayUnion(...uploadedUrls),
      });
    }

    // --------------------------------------------
    // Return updated task
    // --------------------------------------------
    const refreshed = await taskRef.get();

    return NextResponse.json({
      success: true,
      task: { id: refreshed.id, ...refreshed.data() },
    });

  } catch (err: any) {
    console.error("Update failed:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
