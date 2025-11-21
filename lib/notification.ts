// lib/notification.ts
import db from "./db";

export async function sendNotificationToStudents(students, classroom) {
  const notifications = students.map((student) =>
    db.notification.create({
      data: {
        userId: student.id,
        title: "มีคลาสรูมใหม่!",
        message: `คุณถูกเพิ่มในคลาส ${classroom.name}`,
        classroomId: classroom.id,
      },
    })
  );

  await Promise.all(notifications);
}
