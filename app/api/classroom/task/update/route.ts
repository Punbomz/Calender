// app/api/classroom/task/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";

export async function PUT(request: NextRequest) {
  try {
    // Verify user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const teacherId = decodedToken.uid;

    // Parse form data
    const formData = await request.formData();
    const classroomId = formData.get("classroomId") as string;
    const taskId = formData.get("taskId") as string;
    const taskName = formData.get("taskName") as string;
    const description = formData.get("description") as string;
    const deadLine = formData.get("deadLine") as string;
    const category = (formData.get("category") as string) || "Homework";
    const filesToRemoveJson = formData.get("filesToRemove") as string;

    const files = formData.getAll("files");

    if (!classroomId || !taskId || !taskName || !deadLine) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify classroom & teacher
    const classroomRef = adminDb.collection("classrooms").doc(classroomId);
    const classroomSnap = await classroomRef.get();

    if (!classroomSnap.exists) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroomSnap.data()?.teacher !== teacherId) {
      return NextResponse.json(
        { error: "Only the teacher can update tasks" },
        { status: 403 }
      );
    }

    // Get task data
    const taskRef = classroomRef.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let existingFiles = taskSnap.data()?.files || [];

    // Parse filesToRemove
    let filesToRemove: string[] = [];
    try {
      filesToRemove = JSON.parse(filesToRemoveJson || "[]");
    } catch (e) {
      filesToRemove = [];
    }

    const storage = getStorage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      console.error("❌ Missing storage bucket env variable");
      return NextResponse.json({ error: "Storage bucket misconfigured" }, { status: 500 });
    }

    const bucket = storage.bucket(bucketName);

    // --------------------------
    // 🔥 Remove files from storage
    // --------------------------
    for (const fileUrl of filesToRemove) {
      try {
        const url = new URL(fileUrl);
        let filePath = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

        if (filePath.startsWith(bucketName + "/")) {
          filePath = filePath.replace(bucketName + "/", "");
        }

        const fileRef = bucket.file(filePath);
        const [exists] = await fileRef.exists();

        if (exists) await fileRef.delete();
      } catch (err) {
        console.error("File removal failed:", err);
      }
    }

    // keep only non-deleted files
    existingFiles = existingFiles.filter((url: string) => !filesToRemove.includes(url));

    // --------------------------
    // 🔥 Upload new files
    // --------------------------
    const newFileUrls: string[] = [];

    if (files && files.length > 0) {
      try {
        const storage = getStorage();
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
        const bucket = storage.bucket(bucketName);

        for (const file of files) {
          if (!(file instanceof Blob)) continue;
          if (file.size === 0) continue;

          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const safeName = (file as any).name?.replace(/\s+/g, "_") || "upload";
          const filePath = `classrooms/${classroomId}/tasks/${Date.now()}-${safeName}`;
          const fileRef = bucket.file(filePath);

          await fileRef.save(buffer, {
            metadata: { contentType: file.type || "application/octet-stream" },
            resumable: false,
          });

          // ❌ ไม่ต้อง makePublic()
          // await fileRef.makePublic();

          // ✅ ลิงก์แบบ Firebase API
          const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;

          newFileUrls.push(firebaseUrl);
        }
      } catch (storageError) {
        console.error("❌ Storage Upload Error:", storageError);
      }
    }

    // --------------------------
    // 🔥 Save updated task
    // --------------------------
    const finalFiles = [...existingFiles, ...newFileUrls];

    await taskRef.update({
      taskName,
      description: description || "",
      deadLine,
      category,
      files: finalFiles,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      taskId,
      filesRemoved: filesToRemove.length,
      filesAdded: newFileUrls.length,
      totalFiles: finalFiles.length,
    });
  } catch (error) {
    console.error("❌ Internal error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
