// app/api/classroom/task/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";

export async function DELETE(request: NextRequest) {
  try {
    // Verify user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("❌ No session cookie found");
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      console.log("✅ Session verified for teacher:", decodedToken.uid);
    } catch (error) {
      console.error("❌ Session verification failed:", error);
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const teacherId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const { classroomId, taskId } = body;

    console.log("🗑️ Delete task request:", {
      classroomId,
      taskId,
    });

    // Validation
    if (!classroomId || !taskId) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify classroom exists and user is the teacher
    const classroomRef = adminDb.collection("classrooms").doc(classroomId);
    const classroomSnap = await classroomRef.get();

    if (!classroomSnap.exists) {
      console.error("❌ Classroom not found:", classroomId);
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    const classroomData = classroomSnap.data();
    if (classroomData?.teacher !== teacherId) {
      console.error("❌ Unauthorized: User is not the teacher");
      return NextResponse.json(
        { error: "Only the teacher can delete tasks" },
        { status: 403 }
      );
    }

    // Get task data to retrieve file URLs
    const taskRef = classroomRef.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      console.error("❌ Task not found:", taskId);
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const taskData = taskSnap.data();
    const files = taskData?.files || [];

    console.log(`📁 Task has ${files.length} files to delete`);

    // Delete all associated files from storage
    if (files.length > 0) {
      try {
        const storage = getStorage();
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        const bucket = storage.bucket(bucketName);

        for (const fileUrl of files) {
          try {
            // Extract file path from URL
            const url = new URL(fileUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)$/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[1]);
              const fileRef = bucket.file(filePath);
              await fileRef.delete();
              console.log(`✅ Deleted file: ${filePath}`);
            }
          } catch (fileError) {
            console.error(`⚠️ Could not delete file ${fileUrl}:`, fileError);
            // Continue with other files
          }
        }
      } catch (storageError) {
        console.error("❌ Storage error while deleting files:", storageError);
        // Continue with task deletion even if file deletion fails
      }
    }

    // Delete the task document
    console.log("💾 Deleting task from classroom subcollection...");
    await taskRef.delete();
    console.log("✅ Task deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Task and associated files deleted successfully",
      filesDeleted: files.length,
    });
  } catch (error) {
    console.error("❌ Error deleting classroom task:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';