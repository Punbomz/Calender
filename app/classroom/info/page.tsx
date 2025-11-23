// app/classroom/info/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddClassroomTaskModal from "@/app/classroom/addClassroomTask";
import { X, Calendar, BookOpen, AlignLeft, Download, ExternalLink, Type } from "lucide-react";

interface Classroom {
  id: string;
  name: string;     
  code: string;   
  teacher: string;
}

interface Task {
  id: string;
  name: string;
}

interface TaskData {
  taskName: string;
  description: string;
  deadLine: string;
  category: string;
  createdAt: string;
  createdBy: string;
  files: string[];
}

// Task Details Modal Component (inline to avoid import issues)
function TaskDetailsModal({ 
  classroomId, 
  taskId, 
  onClose 
}: { 
  classroomId: string; 
  taskId: string; 
  onClose: () => void;
}) {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        console.log(`📋 Fetching task: ${taskId} from classroom: ${classroomId}`);
        
        const response = await fetch(`/api/classroom/task/details?classroomId=${classroomId}&taskId=${taskId}`);
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch task details");
        }

        const data = await response.json();
        console.log(`✅ Task data received:`, data);
        setTaskData(data.task);
      } catch (err) {
        console.error("❌ Error fetching task details:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [classroomId, taskId]);

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) return '🖼️';
    if (lowerUrl.includes('.pdf')) return '📄';
    if (lowerUrl.match(/\.(doc|docx)$/)) return '📝';
    if (lowerUrl.match(/\.(xls|xlsx)$/)) return '📊';
    if (lowerUrl.match(/\.(ppt|pptx)$/)) return '📽️';
    return '📎';
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'file';
      return decodeURIComponent(fileName);
    } catch {
      return 'file';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#6B4E3D] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative border-2 border-[#5A3E2F] max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">รายละเอียดงาน</h2>
            <p className="text-sm text-white/70 mt-1">ข้อมูลงานที่มอบหมาย</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/40 border-l-4 border-red-500 text-red-200 rounded-r-lg text-sm">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && taskData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                    <Type size={18} />
                    ชื่องาน
                  </label>
                  <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                    {taskData.taskName}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                    <Calendar size={18} />
                    กำหนดส่ง
                  </label>
                  <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                    {formatDateTime(taskData.deadLine)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <BookOpen size={18} />
                  หมวดหมู่
                </label>
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                  {taskData.category === "Homework" && "Homework (การบ้าน)"}
                  {taskData.category === "Lab" && "Lab (ปฏิบัติการ)"}
                  {taskData.category === "Project" && "Project (โครงงาน)"}
                  {taskData.category === "Quiz" && "Quiz (สอบย่อย)"}
                  {taskData.category === "Exam" && "Exam (สอบ)"}
                  {!["Homework", "Lab", "Project", "Quiz", "Exam"].includes(taskData.category) && taskData.category}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <AlignLeft size={18} />
                  รายละเอียด
                </label>
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white min-h-[100px] whitespace-pre-wrap">
                  {taskData.description || <span className="text-white/50 italic">ไม่มีรายละเอียด</span>}
                </div>
              </div>

              {taskData.files && taskData.files.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    ไฟล์แนบ ({taskData.files.length})
                  </label>
                  <div className="space-y-2">
                    {taskData.files.map((fileUrl, index) => {
                      const fileName = getFileName(fileUrl);
                      const icon = getFileIcon(fileUrl);
                      const isImage = fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all"
                        >
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{fileName}</p>
                          </div>
                          <div className="flex gap-2">
                            {isImage && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                title="ดูรูปภาพ"
                              >
                                <ExternalLink size={18} />
                              </a>
                            )}
                            <a
                              href={fileUrl}
                              download
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                              title="ดาวน์โหลด"
                            >
                              <Download size={18} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/20">
                <p className="text-sm text-white/60">
                  สร้างเมื่อ: {formatDateTime(taskData.createdAt)}
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 flex items-center justify-end border-t border-white/20 mt-6">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white text-[#6B4E3D] hover:bg-white/90 font-medium rounded-xl transition shadow-lg"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfoClassroomPage() {
  const searchParams = useSearchParams();
  const classroomIdFromUrl = searchParams.get("id");
  const router = useRouter();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [teacherName, setTeacherName] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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
      router.push("/classroom");
    } catch (err) {
      console.error("Error deleting classroom:", err);
      alert(err instanceof Error ? err.message : "Failed to delete classroom");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskAdded = () => {
    const id = classroomIdFromUrl;
    if (id) {
      fetch(`/api/classroom/info?id=${id}`)
        .then(res => res.json())
        .then(data => {
          setClassroom(data.classroom);
          setTeacherName(data.teacherName);
          setTasks(data.tasks);
          setStudents(data.students);
          setUserRole(data.userRole);
        })
        .catch(err => console.error("Error refreshing data:", err));
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
      router.push("/classroom");
    } catch (err) {
      console.error("Error leaving classroom:", err);
      alert(err instanceof Error ? err.message : "Failed to leave classroom");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskClick = (taskId: string) => {
    console.log(`🖱️ Task clicked: ${taskId}`);
    setSelectedTaskId(taskId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <div className="bg-black px-4 py-3 text-xl font-bold text-white">
          My Classroom
        </div>
        <div className="flex flex-1 items-start justify-center bg-gray-200 px-4 py-8">
          <div className="w-full max-w-3xl rounded-2xl bg-[#5b3526] p-6 shadow-xl animate-pulse">
            <div className="mb-4 flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-400 rounded"></div>
              <div className="h-9 bg-gray-400 rounded w-3/4"></div>
            </div>
            <div className="h-6 bg-gray-400 rounded w-1/2 mb-1"></div>
            <div className="mt-3 mb-5 flex items-center gap-2">
              <div className="h-6 bg-gray-400 rounded w-16"></div>
              <div className="h-10 bg-white rounded-lg w-32"></div>
            </div>
            <div className="h-12 bg-gray-400 rounded-lg w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <div className="bg-black px-4 py-3 text-xl font-bold text-white">
          My Classroom
        </div>
        <div className="flex flex-1 items-start justify-center bg-gray-200 pt-8 px-4">
          <div className="rounded-xl bg-white px-4 py-3 text-gray-800 shadow">
            {error || "ไม่พบข้อมูลห้องเรียน"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <div className="bg-black px-4 py-3 text-xl font-bold text-white">
        My Classroom
      </div>

      <div className="flex flex-1 items-start justify-center bg-gray-200 px-4 py-8">
        <div className="w-full max-w-3xl rounded-2xl bg-[#5b3526] p-6 text-white shadow-xl">
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

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📝</span>
              <h3 className="text-xl font-semibold underline">Task ({tasks.length})</h3>
            </div>
            <div className="mt-2 rounded-lg bg-white p-4 text-black">
              {tasks.length > 0 ? (
                <ul className="space-y-2">
                  {tasks.map((task) => (
                    <li 
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group"
                    >
                      <span className="text-blue-500 group-hover:text-blue-600">📄</span>
                      <span className="text-base group-hover:text-blue-600 group-hover:underline">
                        {task.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีงาน</span>
              )}
            </div>
          </div>

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
            className="mt-4 w-full rounded-lg bg-white px-4 py-3 text-lg font-semibold text-black hover:bg-gray-100 transition-colors hover:cursor-pointer"
            onClick={() => router.back()}
          >
            ⬅️ Back
          </button>

          {userRole === "teacher" && (
            <div className="mt-3 space-y-2">
              <button 
                className="hover:cursor-pointer w-full rounded-lg bg-blue-500 px-4 py-3 text-lg font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowAddTaskModal(true)}
                disabled={actionLoading}
              >
                ➕ Add Task
              </button>
              
              <button 
                className="hover:cursor-pointer w-full rounded-lg bg-red-500 px-4 py-3 text-lg font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteClassroom}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "🗑️ Delete Classroom"}
              </button>
            </div>
          )}

          {userRole === "student" && (
            <button 
              className="hover:cursor-pointer mt-3 w-full rounded-lg bg-yellow-500 px-4 py-3 text-lg font-semibold text-white hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleLeaveClassroom}
              disabled={actionLoading}
            >
              {actionLoading ? "Leaving..." : "🚪 Leave Classroom"}
            </button>
          )}
        </div>
      </div>

      {showAddTaskModal && classroom && (
        <AddClassroomTaskModal
          classroomId={classroom.id}
          classroomName={classroom.name}
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={handleTaskAdded}
        />
      )}

      {selectedTaskId && classroom && (
        <TaskDetailsModal
          classroomId={classroom.id}
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}