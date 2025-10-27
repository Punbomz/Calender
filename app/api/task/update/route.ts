import { NextResponse, NextRequest } from 'next/server';
// 1. Import 'db' (Firestore instance) จาก firebaseAdmin.ts
// (ชื่อ 'db' อาจต่างกันไป ขึ้นอยู่กับว่าคุณ export ไว้อย่างไร)
import { adminDb as db } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    // 2. รับข้อมูลจาก body ที่ frontend ส่งมา
    // frontend ของเพื่อนคุณต้องส่งมาในรูปแบบ:
    // { "id": "รหัสtask123", "title": "หัวข้อใหม่", "completed": true }
    const body = await req.json();
    const { id, ...updateData } = body;

    // 3. ตรวจสอบว่ามี ID ส่งมาหรือไม่
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 } // Bad Request
      );
    }

    // 4. อ้างอิงไปยังเอกสาร task ใน Firestore
    // *** สำคัญ: 'tasks' คือชื่อ collection ของคุณ ถ้าใช้ชื่ออื่นให้เปลี่ยนตรงนี้ ***
    const taskRef = db.collection('tasks').doc(id as string);

    // 5. สั่งอัปเดตเอกสารด้วยข้อมูลใหม่
    await taskRef.update(updateData);

    // 6. ส่งคำตอบว่าอัปเดตสำเร็จ
    return NextResponse.json(
      { message: 'Task updated successfully', id: id },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}