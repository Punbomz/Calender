import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function DELETE(req: Request) {
  try {
    const { userId, photoURL } = await req.json();

    console.log('📥 Received delete avatar request:', { userId, photoURL });

    if (!userId || !photoURL) {
      return NextResponse.json(
        { success: false, error: "Missing userId or photoURL" },
        { status: 400 }
      );
    }

    // Don't delete if it's a default/placeholder image
    if (!photoURL.includes('firebasestorage.googleapis.com')) {
      console.log('ℹ️ Skipping deletion - not a Firebase Storage URL');
      return NextResponse.json({
        success: true,
        message: "Not a Firebase Storage URL, skipping deletion",
      });
    }

    console.log('🗑️ Deleting profile avatar from Storage');

    try {
      // Extract file path from Firebase Storage URL
      let filePath = '';
      
      if (photoURL.includes('/o/')) {
        const urlMatch = photoURL.match(/\/o\/([^?]+)/);
        if (urlMatch && urlMatch[1]) {
          // Decode the URL-encoded path
          filePath = decodeURIComponent(urlMatch[1]);
          console.log('📂 Extracted file path:', filePath);
        }
      }

      if (!filePath) {
        throw new Error('Could not extract file path from URL');
      }

      // Delete from Storage
      const bucket = adminStorage.bucket(
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      );
      
      await bucket.file(filePath).delete();
      
      console.log(`✅ Deleted avatar file: ${filePath}`);

      return NextResponse.json({
        success: true,
        message: "Avatar deleted successfully",
        deletedPath: filePath,
      });

    } catch (storageErr: any) {
      // If file doesn't exist, consider it a success
      if (storageErr.code === 404 || storageErr.message?.includes('No such object')) {
        console.log('ℹ️ File already deleted or does not exist');
        return NextResponse.json({
          success: true,
          message: "File already deleted or does not exist",
        });
      }
      
      throw storageErr;
    }

  } catch (error: any) {
    console.error("❌ Delete avatar failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}