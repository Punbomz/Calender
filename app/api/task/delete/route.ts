import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function DELETE(req: Request) {
  try {
    const { userId, taskId } = await req.json();

    if (!userId || !taskId) {
      return NextResponse.json({ error: "Missing userId or taskId" }, { status: 400 });
    }

    const docRef = adminDb.doc(`users/${userId}/tasks/${taskId}`);
    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete failed:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
