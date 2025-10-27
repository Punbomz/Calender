import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseClient";   // ถ้าคุณใช้ server SDK ให้เปลี่ยนตามที่มี
import { doc, deleteDoc } from "firebase/firestore"; // ถ้าใช้ Admin SDK แทน ก็ปรับให้ตรง

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: (ถ้ามี Auth) ตรวจสิทธิ์ว่าเป็น owner ก่อนถึงจะลบได้
    await deleteDoc(doc(db, "tasks", params.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
