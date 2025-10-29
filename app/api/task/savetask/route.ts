import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    // อ่านข้อมูลจาก body
    const { userId, title, detail, status } = await req.json();

    // ตรวจสอบค่าที่จำเป็น
    if (!userId || !title) {
      return NextResponse.json({ error: "Missing userId or title" }, { status: 400 });
    }

    // เตรียมข้อมูล task
    const taskData = {
      title,
      detail: detail || "",
      status: status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // เลือก collection ของ user
    const collectionRef = collection(db, "users", userId, "tasks");

    // สร้าง document ใหม่
    const newDoc = await addDoc(collectionRef, taskData);

    // ส่ง response กลับ
    return NextResponse.json({ ok: true, taskId: newDoc.id });
  } catch (e) {
    console.error("Save failed:", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
