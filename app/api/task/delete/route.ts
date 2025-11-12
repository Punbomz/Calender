import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";

export async function DELETE(req: Request) {
  try {
    const { userId, taskId } = await req.json();

    if (!userId || !taskId) {
      return NextResponse.json({ error: "Missing userId or taskId" }, { status: 400 });
    }

    // ดึงข้อมูล task ก่อนลบ
    const docRef = adminDb.doc(`users/${userId}/tasks/${taskId}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskData = docSnap.data();
    const attachments = taskData?.attachments; // เปลี่ยนจาก attachment เป็น attachments

    // ลบไฟล์ทั้งหมดใน attachments array
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const attachmentUrl of attachments) {
        try {
          // Extract filename from URL
          const urlParts = attachmentUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          
          // Construct the full path: tasks/userId/filename
          const filePath = `tasks/${userId}/${filename}`;

          const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
          await bucket.file(filePath).delete();

          console.log(`✅ Deleted storage file: ${filePath}`);
        } catch (storageErr) {
          console.warn("⚠️ Failed to delete storage file:", storageErr);
        }
      }
    }

    // ลบเอกสารใน Firestore
    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("❌ Delete failed:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}