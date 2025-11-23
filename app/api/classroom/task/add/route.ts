// app/api/classroom/task/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";

export async function POST(request: NextRequest) {
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
    const taskName = formData.get("taskName") as string;
    const description = formData.get("description") as string;
    const deadLine = formData.get("deadLine") as string;
    const category = formData.get("category") as string;
    
    // Get all file entries
    const files = formData.getAll("files");

    console.log("📝 Task details:", {
      classroomId,
      taskName,
      deadLine,
      category,
      filesCount: files.length,
    });

    // Validation
    if (!classroomId || !taskName || !deadLine) {
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
        { error: "Only the teacher can add tasks" },
        { status: 403 }
      );
    }

    console.log("✅ Classroom verified. Students count:", classroomData?.students?.length || 0);

    // Upload files to Firebase Storage (using the same pattern as addtask route)
    const fileUrls: string[] = [];
    
    if (files && files.length > 0) {
      try {
        const storage = getStorage();
        // Use explicit bucket name like in the working route
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
            fileUrls.push(publicUrl);
            
            console.log(`✅ File uploaded: ${publicUrl}`);
          } catch (fileError) {
            console.error(`❌ Error uploading file ${file instanceof File ? file.name : 'unknown'}:`, fileError);
            // Continue with other files instead of failing completely
          }
        }
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
        console.log("⚠️ Continuing without file uploads");
      }
    } else {
      console.log("ℹ️ No files to upload");
    }

    console.log(`📊 Total files uploaded: ${fileUrls.length}`);

    // Create task in classroom's tasks subcollection
    const taskData = {
      taskName: taskName,
      description: description || "",
      deadLine: deadLine,
      category: category || "Homework",
      createdAt: new Date().toISOString(),
      createdBy: teacherId,
      files: fileUrls,
    };

    console.log("💾 Creating task in classroom subcollection...");
    const taskRef = await classroomRef.collection("tasks").add(taskData);
    console.log("✅ Task created with ID:", taskRef.id);

    // Note: Tasks will be synced to students via the sync API
    // No need to add tasks immediately - the sync will handle it

    return NextResponse.json({
      success: true,
      message: "Task added successfully. Students will receive it on next sync.",
      taskId: taskRef.id,
      filesUploaded: fileUrls.length,
    });
  } catch (error) {
    console.error("❌ Error adding classroom task:", error);
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