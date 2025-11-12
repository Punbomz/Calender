import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";

export async function DELETE(req: Request) {
  try {
    const { userId, taskId, fileUrls } = await req.json();

    console.log('📥 Received delete request:', { userId, taskId, fileUrls });

    if (!taskId || !fileUrls || !Array.isArray(fileUrls)) {
      return NextResponse.json(
        { success: false, error: "Missing taskId or fileUrls" },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing userId" },
        { status: 401 }
      );
    }

    console.log(`🗑️ Deleting ${fileUrls.length} file(s) from task ${taskId}`);

    // Get the task document reference
    const taskRef = adminDb.doc(`users/${userId}/tasks/${taskId}`);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      console.error('❌ Task not found:', `users/${userId}/tasks/${taskId}`);
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const taskData = taskSnap.data();
    const currentAttachments = taskData?.attachments || [];

    console.log('📋 Current attachments in Firestore:', currentAttachments);

    // Delete files from Storage
    const deletionResults = [];
    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

    for (const fileUrl of fileUrls) {
      try {
        console.log('🔍 Processing URL:', fileUrl);

        // Firebase Storage URL formats:
        // https://firebasestorage.googleapis.com/v0/b/bucket-name/o/path%2Fto%2Ffile.jpg?alt=media&token=...
        // We need to extract the path between /o/ and ?
        
        let filePath = '';
        
        if (fileUrl.includes('/o/')) {
          // Extract encoded path from Firebase Storage URL
          const urlMatch = fileUrl.match(/\/o\/([^?]+)/);
          if (urlMatch && urlMatch[1]) {
            // Decode the URL-encoded path
            filePath = decodeURIComponent(urlMatch[1]);
            console.log('📂 Extracted file path:', filePath);
          }
        } else {
          // Fallback: try to extract filename from the end of URL
          const urlParts = fileUrl.split('/');
          const fileNameWithQuery = urlParts[urlParts.length - 1];
          const filename = decodeURIComponent(fileNameWithQuery.split('?')[0]);
          filePath = `tasks/${userId}/${filename}`;
          console.log('📂 Fallback file path:', filePath);
        }

        if (!filePath) {
          throw new Error('Could not extract file path from URL');
        }

        // Delete from Storage
        await bucket.file(filePath).delete();
        
        console.log(`✅ Deleted storage file: ${filePath}`);
        deletionResults.push({ url: fileUrl, success: true, path: filePath });
      } catch (storageErr: any) {
        console.error(`⚠️ Failed to delete storage file ${fileUrl}:`, storageErr.message);
        deletionResults.push({ 
          url: fileUrl, 
          success: false, 
          error: storageErr.message 
        });
        // Continue with other files even if one fails
      }
    }

    // Update Firestore document - remove the deleted URLs from attachments array
    const updatedAttachments = currentAttachments.filter(
      (url: string) => !fileUrls.includes(url)
    );

    console.log('📝 Updated attachments array:', updatedAttachments);

    await taskRef.update({
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Successfully updated task ${taskId} in Firestore`);
    console.log(`📊 Deleted ${fileUrls.length} file(s), ${updatedAttachments.length} remaining`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${fileUrls.length} file(s)`,
      deletionResults,
      remainingAttachments: updatedAttachments,
    });

  } catch (error: any) {
    console.error("❌ Delete attachments failed:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}