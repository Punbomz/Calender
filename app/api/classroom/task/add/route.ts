// app/api/classroom/task/add/route.ts  
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const teacherId = decodedToken.uid;

    const formData = await request.formData();
    const classroomId = formData.get("classroomId") as string;
    const taskName = formData.get("taskName") as string;
    const description = formData.get("description") as string;
    const deadLine = formData.get("deadLine") as string;
    const category = formData.get("category") as string;
    const files = formData.getAll("files");

    if (!classroomId || !taskName || !deadLine) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const classroomRef = adminDb.collection("classrooms").doc(classroomId);
    const classroomSnap = await classroomRef.get();

    if (!classroomSnap.exists) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroomSnap.data()?.teacher !== teacherId) {
      return NextResponse.json({ error: "Only the teacher can add tasks" }, { status: 403 });
    }

    // --- FILE UPLOAD FIX START ---
    const fileUrls: string[] = [];

    if (files.length > 0) {
      const storage = getStorage();
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
      const bucket = storage.bucket(bucketName);

      for (const file of files) {
        if (!(file instanceof File) || file.size === 0) continue;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeName = file.name.replace(/\s+/g, "_");
        const token = uuidv4();
        const filePath = `classrooms/${classroomId}/tasks/${Date.now()}-${token}-${safeName}`;
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
          `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

        fileUrls.push(publicUrl);
      }
    }
    // --- FILE UPLOAD FIX END ---

    const taskData = {
      taskName,
      description: description || "",
      deadLine,
      category: category || "Homework",
      createdAt: new Date().toISOString(),
      createdBy: teacherId,
      files: fileUrls,
    };

    const taskRef = await classroomRef.collection("tasks").add(taskData);

    return NextResponse.json({
      success: true,
      message: "Task added successfully.",
      taskId: taskRef.id,
      filesUploaded: fileUrls.length,
    });

  } catch (error: any) {
    console.error("Error adding classroom task:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
