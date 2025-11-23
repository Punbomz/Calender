// app/classroom/infoClassroom.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebaseClient";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

interface Classroom {
  id: string;
  name: string;     
  code: string;   
  teacher: string;  
}

export default function InfoClassroomPage() {
  const searchParams = useSearchParams();
  const classroomIdFromUrl = searchParams.get("id");
  const router = useRouter();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = classroomIdFromUrl; 

    if (!id) {
      // ไม่มี id ใน URL ก็ไม่ต้องยิง Firestore
      setClassroom(null);
      setTasks([]);
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // ---------- 1) ข้อมูลห้องเรียน ----------
        const classRef = doc(db, "classrooms", id);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
          console.warn("Classroom not found for id:", id);
          setClassroom(null);
          setTasks([]);
          setStudents([]);
          setLoading(false);
          return;
        }

        const classData = classSnap.data() as Omit<Classroom, "id">;
        setClassroom({ id: classSnap.id, ...classData });

        // ---------- 2) subcollection: tasks ----------
        const tasksCol = collection(db, "classrooms", id, "tasks");
        const tasksSnap = await getDocs(tasksCol);
        const taskNames = tasksSnap.docs
          .map((d) => (d.data().name as string) ?? "")
          .filter(Boolean);
        setTasks(taskNames);

        // ---------- 3) subcollection: students ----------
        const studentsCol = collection(db, "classrooms", id, "students");
        const studentsSnap = await getDocs(studentsCol);
        const studentNames = studentsSnap.docs
          .map((d) => (d.data().name as string) ?? "")
          .filter(Boolean);
        setStudents(studentNames);
      } catch (err) {
        console.error("Error loading classroom info:", err);
        setClassroom(null);
        setTasks([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [classroomIdFromUrl]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <div className="bg-black px-4 py-3 text-xl font-bold text-white">
          My Classroom
        </div>
        <div className="flex flex-1 items-center justify-center bg-gray-200">
          <div className="text-gray-700">Loading…</div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <div className="bg-black px-4 py-3 text-xl font-bold text-white">
          My Classroom
        </div>
        <div className="flex flex-1 items-center justify-center bg-gray-200">
          <div className="rounded-xl bg-white px-4 py-3 text-gray-800 shadow">
            ไม่พบข้อมูลห้องเรียน (ตรวจสอบว่า URL มีพารามิเตอร์ <code>?id=...</code> หรือยัง)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-black px-4 py-3 text-xl font-bold text-white">
        My Classroom
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center bg-gray-200 px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-[#5b3526] p-4 text-white shadow-xl">
          {/* ชื่อวิชา */}
          <div className="mb-3 flex items-center gap-2">
            <span>🏠</span>
            <h2 className="text-2xl font-bold">{classroom.name}</h2>
          </div>

          <p className="text-sm">Teacher: {classroom.teacher}</p>

          <div className="mt-2 mb-4 flex items-center gap-2">
            <span>Code:</span>
            <span className="rounded-lg bg-white px-3 py-1 font-mono text-black">
              {classroom.code}
            </span>
          </div>

          {/* Task */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span>📓</span>
              <h3 className="underline">Task</h3>
            </div>
            <div className="mt-1 rounded-lg bg-white p-2 text-black">
              {tasks.length > 0 ? (
                <ul className="list-disc pl-4">
                  {tasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีงาน</span>
              )}
            </div>
          </div>

          {/* Student */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span>🎓</span>
              <h3 className="underline">Student ({students.length})</h3>
            </div>
            <div className="mt-1 rounded-lg bg-white p-2 text-black">
              {students.length > 0 ? (
                <ol className="list-decimal pl-4">
                  {students.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีนักเรียน</span>
              )}
            </div>
          </div>

          <button className="mt-2 w-full rounded-lg bg-white px-4 py-2 text-black"
                  onClick={() => router.back()}>
            ⬅ Leave
          </button>
        </div>
      </div>
    </div>
  );
}
