import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendNotificationToStudents } from "@/lib/notification";

export async function POST(req: Request) {
  const data = await req.json();

  const classroom = await db.classroom.create({
    data: {
      name: data.name,
      teacherId: data.teacherId,
    },
  });

  //ดึงรายชื่อเด็กนักเรียนทั้งหมด
  const students = await db.user.findMany({
    where: { role: "STUDENT" },
  });

  //ส่งแจ้งเตือน
  await sendNotificationToStudents(students, classroom); 

  return NextResponse.json({ ok: true, classroom });
}
