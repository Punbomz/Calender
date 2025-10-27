import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseClient";
import { doc, deleteDoc } from "firebase/firestore";

export async function DELETE(req: Request) {
  try {
    // อ่านข้อมูลจาก body
    const { userId, taskId } = await req.json();

    // ตรวจสอบค่าที่จำเป็น
    if (!userId || !taskId) {
      return NextResponse.json({ error: "Missing userId or taskId" }, { status: 400 });
    }

    // path: users/{userId}/tasks/{taskId}
    const docRef = doc(db, "users", userId, "tasks", taskId);
    await deleteDoc(docRef);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete failed:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
