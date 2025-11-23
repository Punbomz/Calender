// app/classroom/info/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  const [teacherName, setTeacherName] = useState<string>("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const id = classroomIdFromUrl; 

    if (!id) {
      setClassroom(null);
      setTeacherName("");
      setTasks([]);
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/classroom/info?id=${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch classroom info");
        }

        setClassroom(data.classroom);
        setTeacherName(data.teacherName);
        setTasks(data.tasks);
        setStudents(data.students);
        setUserRole(data.userRole);
      } catch (err) {
        console.error("Error loading classroom info:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setClassroom(null);
        setTeacherName("");
        setTasks([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [classroomIdFromUrl]);

  const handleDeleteClassroom = async () => {
    if (!window.confirm("Are you sure you want to delete this classroom? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/classroom/deleteClassroomById", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classroomId: classroomIdFromUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete classroom");
      }

      alert("Classroom deleted successfully!");
      router.push("/classroom"); // Navigate back to classroom list
    } catch (err) {
      console.error("Error deleting classroom:", err);
      alert(err instanceof Error ? err.message : "Failed to delete classroom");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClassroom = async () => {
    if (!window.confirm("Are you sure you want to leave this classroom? All related tasks will be deleted.")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/classroom/leaveClassById", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classroomId: classroomIdFromUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave classroom");
      }

      alert(`Left classroom successfully! ${data.deletedTasksCount || 0} tasks were removed.`);
      router.push("/classroom"); // Navigate back to classroom list
    } catch (err) {
      console.error("Error leaving classroom:", err);
      alert(err instanceof Error ? err.message : "Failed to leave classroom");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <div className="bg-black text-white p-6">
          <h1 className="text-2xl font-bold">My Classroom</h1>
        </div>
        <div className="flex flex-1 items-start justify-center bg-gray-200 px-4 py-8">
          <div className="w-full max-w-3xl rounded-2xl bg-[#5b3526] p-6 shadow-xl animate-pulse">
            {/* Title Skeleton */}
            <div className="mb-4 flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-400 rounded"></div>
              <div className="h-9 bg-gray-400 rounded w-3/4"></div>
            </div>

            {/* Teacher Skeleton */}
            <div className="h-6 bg-gray-400 rounded w-1/2 mb-1"></div>

            {/* Code Skeleton */}
            <div className="mt-3 mb-5 flex items-center gap-2">
              <div className="h-6 bg-gray-400 rounded w-16"></div>
              <div className="h-10 bg-white rounded-lg w-32"></div>
            </div>

            {/* Task Section Skeleton */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-400 rounded"></div>
                <div className="h-7 bg-gray-400 rounded w-24"></div>
              </div>
              <div className="mt-2 rounded-lg bg-white p-4">
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>

            {/* Student Section Skeleton */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-400 rounded"></div>
                <div className="h-7 bg-gray-400 rounded w-32"></div>
              </div>
              <div className="mt-2 rounded-lg bg-white p-4">
                <div className="h-5 bg-gray-300 rounded w-2/3 mb-2"></div>
                <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-5 bg-gray-300 rounded w-3/5"></div>
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="h-12 bg-gray-400 rounded-lg w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <div className="bg-black text-white p-6">
          <h1 className="text-2xl font-bold">My Classroom</h1>
        </div>
        <div className="flex flex-1 items-start justify-center bg-gray-200 pt-8 px-4">
          <div className="rounded-xl bg-white px-4 py-3 text-gray-800 shadow">
            {error || "ไม่พบข้อมูลห้องเรียน (ตรวจสอบว่า URL มีพารามิเตอร์ ?id=... หรือยัง)"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <h1 className="text-2xl font-bold">My Classroom</h1>
      </div>

      {/* Content - Start from top */}
      <div className="flex flex-1 items-start justify-center bg-gray-200 px-4 py-8">
        <div className="w-full max-w-3xl rounded-2xl bg-[#5b3526] p-6 text-white shadow-xl">
          {/* ชื่อวิชา */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <h2 className="text-3xl font-bold">{classroom.name}</h2>
          </div>

          <p className="text-lg mb-1">
            Teacher: <span className="font-semibold">{teacherName || "Loading..."}</span>
          </p>

          <div className="mt-3 mb-5 flex items-center gap-2">
            <span className="text-lg">Code:</span>
            <span className="rounded-lg bg-white px-4 py-2 font-mono text-lg text-black font-semibold">
              {classroom.code}
            </span>
          </div>

          {/* Task */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📝</span>
              <h3 className="text-xl font-semibold underline">Task</h3>
            </div>
            <div className="mt-2 rounded-lg bg-white p-4 text-black">
              {tasks.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {tasks.map((t, i) => (
                    <li key={i} className="text-base">{t}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีงาน</span>
              )}
            </div>
          </div>

          {/* Student */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎓</span>
              <h3 className="text-xl font-semibold underline">Student ({students.length})</h3>
            </div>
            <div className="mt-2 rounded-lg bg-white p-4 text-black">
              {students.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-1">
                  {students.map((s, i) => (
                    <li key={i} className="text-base">{s}</li>
                  ))}
                </ol>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีนักเรียน</span>
              )}
            </div>
          </div>

          <button 
            className="mt-4 w-full rounded-lg bg-white px-4 py-3 text-lg font-semibold text-black hover:bg-gray-100 transition-colors"
            onClick={() => router.back()}
          >
            ⬅️ Back
          </button>

          {/* Role-based buttons */}
          {userRole === "teacher" && (
            <div className="mt-3 space-y-2">
              <button 
                className="w-full rounded-lg bg-blue-500 px-4 py-3 text-lg font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  // TODO: Navigate to add task page
                  console.log("Add task clicked");
                }}
                disabled={actionLoading}
              >
                ➕ Add Task
              </button>
              
              <button 
                className="w-full rounded-lg bg-red-500 px-4 py-3 text-lg font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteClassroom}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "🗑️ Delete Classroom"}
              </button>
            </div>
          )}

          {userRole !== "teacher" && (
            <button 
              className="mt-3 w-full rounded-lg bg-yellow-500 px-4 py-3 text-lg font-semibold text-white hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleLeaveClassroom}
              disabled={actionLoading}
            >
              {actionLoading ? "Leaving..." : "🚪 Leave Classroom"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}