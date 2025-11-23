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

    // Parse form data
    const formData = await request.formData();
    const classroomId = formData.get("classroomId") as string;
    const taskId = formData.get("taskId") as string;
    const taskName = formData.get("taskName") as string;
    const description = formData.get("description") as string;
    const deadLine = formData.get("deadLine") as string;
    const category = formData.get("category") as string;
    const filesToRemoveJson = formData.get("filesToRemove") as string;
    
    // Get all new file entries
    const files = formData.getAll("files");

    console.log("📝 Update task details:", {
      classroomId,
      taskId,
      taskName,
      deadLine,
      category,
      newFilesCount: files.length,
    });

    // Validation
    if (!classroomId || !taskId || !taskName || !deadLine) {
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
        { error: "Only the teacher can update tasks" },
        { status: 403 }
      );
    }

    // Get current task data
    const taskRef = classroomRef.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      console.error("❌ Task not found:", taskId);
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const currentTaskData = taskSnap.data();
    let existingFiles = currentTaskData?.files || [];

    // Parse files to remove
    let filesToRemove: string[] = [];
    try {
      filesToRemove = JSON.parse(filesToRemoveJson || "[]");
    } catch (e) {
      console.log("No files to remove or invalid JSON");
    }

    // Remove files from storage and filter from existing files
    if (filesToRemove.length > 0) {
      console.log(`🗑️ Removing ${filesToRemove.length} files...`);
      const storage = getStorage();
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = storage.bucket(bucketName);

      for (const fileUrl of filesToRemove) {
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

      // Filter out removed files from existing files
      existingFiles = existingFiles.filter(
        (url: string) => !filesToRemove.includes(url)
      );
    }

    // Upload new files to Firebase Storage
    const newFileUrls: string[] = [];
    
    if (files && files.length > 0) {
      try {
        const storage = getStorage();
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        const bucket = storage.bucket(bucketName);
        
        console.log('📦 Using storage bucket:', bucketName);

        for (const file of files) {
          if (!(file instanceof File)) continue;
          if (file.size === 0) continue;

          console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`);
          
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Sanitize filename
            const safeName = file.name.replace(/\s+/g, "_");
            const filePath = `classrooms/${classroomId}/tasks/${Date.now()}-${safeName}`;
            const fileRef = bucket.file(filePath);

            await fileRef.save(buffer, {
              metadata: {
                contentType: file.type || "application/octet-stream",
              },
              resumable: false,
            });

            // Make file publicly accessible
            await fileRef.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            newFileUrls.push(publicUrl);
            
            console.log(`✅ File uploaded: ${publicUrl}`);
          } catch (fileError) {
            console.error(`❌ Error uploading file ${file instanceof File ? file.name : 'unknown'}:`, fileError);
            // Continue with other files instead of failing completely
          }
        }
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
        console.log("⚠️ Continuing without new file uploads");
      }
    } else {
      console.log("ℹ️ No new files to upload");
    }

    console.log(`📊 Total new files uploaded: ${newFileUrls.length}`);

    // Combine existing files (minus removed) with new files
    const finalFiles = [...existingFiles, ...newFileUrls];

    // Update task in classroom's tasks subcollection
    const updateData = {
      taskName: taskName,
      description: description || "",
      deadLine: deadLine,
      category: category || "Homework",
      files: finalFiles,
      updatedAt: new Date().toISOString(),
    };

    console.log("💾 Updating task in classroom subcollection...");
    await taskRef.update(updateData);
    console.log("✅ Task updated successfully");

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      taskId: taskId,
      filesAdded: newFileUrls.length,
      filesRemoved: filesToRemove.length,
      totalFiles: finalFiles.length,
    });
  } catch (error) {
    console.error("❌ Error updating classroom task:", error);
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