"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit,
  User,
} from "lucide-react";

import EditTaskModal from "../task/EditTask";

// --- Types ---
type Task = {
  id: string;
  taskName: string;
  start?: string;
  end?: string;
  category?: string;
  description?: string;
  isFinished?: boolean;
  deadLine: string; // Will be converted to ISO string
  priorityLevel: number;
};

interface ModalTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
  isFinished?: boolean;
}

type Categories = Record<string, { color: string }>;

type Settings = {
  weekStart?: "Mon" | "Sun";
  categories?: Categories;
};

const priorityColors: Record<number, string> = {
  3: "#ef4444", 2: "#f59e0b", 1: "#22c55e",
};
const defaultColor = "#888";

const formatTaskDate = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatTaskTime = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
};

// ✅ Helper function to convert Firestore Timestamp to ISO string
const convertTimestampToISO = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  
  // If it's already a string
  if (typeof timestamp === 'string') return timestamp;
  
  // If it's a Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // If it's a Firestore Timestamp with seconds/nanoseconds
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  
  // Fallback: try to create Date from the value
  try {
    return new Date(timestamp).toISOString();
  } catch (e) {
    console.error("Cannot convert timestamp:", timestamp);
    return new Date().toISOString();
  }
};

// --- TaskMenuButton Component ---
function TaskMenuButton({
  task,
  handleDeleteTask,
  handleEditTask,
}: {
  task: Task;
  handleDeleteTask: (taskId: string) => void;
  handleEditTask: (task: Task) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmDelete = () => {
    const confirmed = window.confirm(`ยืนยันที่จะลบงาน "${task.taskName}" หรือไม่?`);
    if (confirmed) handleDeleteTask(task.id);
  };

  return (
    <div className={`relative inline-block ${showMenu ? 'z-20' : 'z-auto'}`} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu((prev) => !prev);
        }}
        className="hover:cursor-pointer p-1.5 sm:p-2 rounded-md text-white hover:bg-white/20 transition"
        aria-label={`Options for ${task.taskName}`}
      >
        <MoreHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-32 sm:w-36 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowMenu(false);
              handleEditTask(task);
            }}
            className="hover:cursor-pointer w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm transition hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit size={14} className="sm:w-4 sm:h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              confirmDelete();
            }}
            className="hover:cursor-pointer w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-red-50 hover:text-red-600 transition"
          >
            <Trash2 size={14} className="sm:w-4 sm:h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// --- CalendarMonth Component ---
function CalendarMonth({
  year,
  month,
  tasks,
  weekStart = "Mon",
  onDateClick,
  selectedDate,
  onToggleTask,
  onDeleteTask,
  onOpenEditModal,
}: {
  year: number;
  month: number;
  tasks: Task[];
  categories: Categories;
  weekStart?: "Mon" | "Sun";
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenEditModal: (task: Task) => void;
}) {
  const [cursor, setCursor] = useState(new Date(year, month, 1));
  function ymd(d: Date | null) { if (!d) return ""; return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  function startOfWeek(d: Date, weekStart: "Mon" | "Sun") { const day = d.getDay(); const diff = weekStart === "Mon" ? (day === 0 ? -6 : 1 - day) : -day; const nd = new Date(d); nd.setDate(d.getDate() + diff); nd.setHours(0, 0, 0, 0); return nd; }
  function monthMatrix(year: number, month: number, weekStart: "Mon" | "Sun") { const first = new Date(year, month, 1); const firstCell = startOfWeek(first, weekStart); return Array.from({ length: 42 }, (_, i) => { const d = new Date(firstCell); d.setDate(firstCell.getDate() + i); return d; }); }
  function dateInTask(date: Date, t: Task) { const taskDate = new Date(t.deadLine); const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999); return taskDate >= dayStart && taskDate <= dayEnd; }
  function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  const cells = monthMatrix(cursor.getFullYear(), cursor.getMonth(), weekStart);
  const weekLabels = weekStart === "Mon" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const nav = (d: number) => { const x = new Date(cursor); x.setMonth(x.getMonth() + d); setCursor(x); };
  const today = new Date();
  const selectedDayTasks = tasks.filter((t) => { if (t.isFinished || !selectedDate) return false; const taskDate = new Date(t.deadLine); return ymd(taskDate) === ymd(selectedDate); });

  return (
    <div className="w-full">
      <div className="w-full bg-neutral-900 rounded-xl sm:rounded-2xl p-2 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <button onClick={() => nav(-1)} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm sm:text-base">
            ‹
          </button>
          <h2 className="text-base sm:text-xl font-semibold text-white">
            {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={() => nav(1)} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm sm:text-base">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs sm:text-sm text-neutral-400 mb-2">
          {weekLabels.map((w) => (
            <div key={w} className="py-1 sm:py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((date, i) => {
            const isOther = date.getMonth() !== cursor.getMonth();
            const isToday = sameDay(date, today);
            const isSelected = selectedDate && sameDay(date, selectedDate);
            const dayTasks = tasks.filter((t) => !t.isFinished && dateInTask(date, t));
            const sortedDayTasks = dayTasks.sort((a, b) => b.priorityLevel - a.priorityLevel);
            const dots = sortedDayTasks.slice(0, 3).map((t) => priorityColors[t.priorityLevel] || defaultColor);
            return (
              <div key={i} onClick={() => onDateClick && onDateClick(date)} className={`rounded-lg sm:rounded-xl p-1.5 sm:p-3 min-h-[60px] sm:min-h-[80px] cursor-pointer transition-all ${isOther ? "bg-neutral-800 opacity-40" : "bg-neutral-800 hover:bg-neutral-700"} ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div className={`text-xs sm:text-sm ${isToday ? "bg-white text-black rounded-full w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center font-bold" : "text-white"}`}>
                    {date.getDate()}
                  </div>
                </div>
                <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                  {dots.map((c, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ background: c }} />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] sm:text-xs text-neutral-400">+{dayTasks.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 mt-3 sm:mt-4">
        <h5 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 text-white">
          Tasks for{" "}
          {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Selected Day"}
        </h5>
        {selectedDayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-6 sm:py-8 text-sm sm:text-base">
            {selectedDate ? "No unfinished tasks for this day" : "Click a date to see tasks"}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {selectedDayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel)
              .map((task) => (
                <div key={task.id} className="rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-md" style={{ backgroundColor: priorityColors[task.priorityLevel] || defaultColor }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, task.isFinished || false); }} className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
                        {task.isFinished && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className={`text-base sm:text-xl truncate font-bold leading-tight ${task.isFinished ? 'line-through' : ''}`}>
                        {task.taskName}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm">
                        <Calendar size={14} className="hidden sm:inline sm:w-4 sm:h-4" />
                        <p className="hidden sm:inline">{formatTaskDate(task.deadLine)}</p>
                        <Clock size={14} className="sm:w-4 sm:h-4" />
                        <span className="font-semibold">{formatTaskTime(task.deadLine)}</span>
                        <TaskMenuButton
                          task={task}
                          handleDeleteTask={onDeleteTask}
                          handleEditTask={onOpenEditModal}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ... (คัดลอก WeekView และ DayView components เหมือนเดิม แต่ใช้ logic เดียวกัน)

// --- Main App Component ---
export default function CalendarApp() {
  const [mainView, setMainView] = useState<"calendar" | "tasks" | "profile">("calendar");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings] = useState<Settings>({
    weekStart: "Mon",
    categories: {
      S: { color: "#ef4444" }, A: { color: "#f59e0b" }, B: { color: "#3b82f6" }, C: { color: "#22c55e" },
    },
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ModalTask | null>(null);

  const convertISOToDateTimeLocal = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().slice(0, 16);
    } catch (e) {
      console.error("Invalid date for conversion:", isoString);
      return "";
    }
  };

  // ✅ แก้ไข loadTasks ให้แปลง Timestamp เป็น ISO string
  const loadTasks = async () => {
    try {
      setError(null);
      console.log("🔄 Loading tasks...");
      
      const response = await fetch("/api/task/gettask?isFinished=false");
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) throw new Error("Failed to fetch tasks");
      
      const data = await response.json();
      console.log("📊 Raw API response:", data);
      
      if (data.success && data.tasks) {
        // ✅ แปลง Timestamp เป็น ISO string
        const convertedTasks = data.tasks.map((task: any) => ({
          ...task,
          deadLine: convertTimestampToISO(task.deadLine),
          // รองรับทั้ง deadline และ deadLine
          ...(task.deadline && !task.deadLine && {
            deadLine: convertTimestampToISO(task.deadline)
          })
        }));
        
        console.log("✅ Converted tasks:", convertedTasks);
        console.log("📝 Number of tasks:", convertedTasks.length);
        
        setTasks(convertedTasks);
      } else {
        throw new Error(data.error || "Failed to load tasks");
      }
    } catch (err: any) {
      console.error("❌ Error loading tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTasks();
  }, []);

  // ✅ เพิ่ม useEffect เพื่อ debug tasks
  useEffect(() => {
    if (tasks.length > 0) {
      console.log("🎯 Current tasks in state:", tasks);
      console.log("📅 Tasks deadlines:", tasks.map(t => ({
        name: t.taskName,
        deadline: t.deadLine,
        isFinished: t.isFinished
      })));
    }
  }, [tasks]);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isFinished: !currentStatus } : task
      )
    );
    try {
      const response = await fetch("/api/task/update", { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        credentials: "include", 
        body: JSON.stringify({ taskId, isFinished: !currentStatus }) 
      });
      if (!response.ok) throw new Error("Failed to update task");
    } catch (err: any) {
      console.error("Error toggling task:", err);
      alert("Failed to update task. Reverting.");
      setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, isFinished: currentStatus } : task));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      const response = await fetch("/api/task/delete", { 
        method: "DELETE", 
        headers: { "Content-Type": "application/json" }, 
        credentials: "include", 
        body: JSON.stringify({ taskId }) 
      });
      if (!response.ok) throw new Error("Failed to delete task");
    } catch (err: any) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Reverting.");
      setTasks(originalTasks);
    }
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask({
      id: task.id,
      title: task.taskName,
      description: task.description || "",
      priority: String(task.priorityLevel),
      category: task.category || "",
      deadline: convertISOToDateTimeLocal(task.deadLine),
      isFinished: task.isFinished || false,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  const handleSaveEditedTask = (updatedModalTask: ModalTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedModalTask.id
          ? {
              ...task,
              taskName: updatedModalTask.title,
              description: updatedModalTask.description,
              priorityLevel: parseInt(updatedModalTask.priority),
              category: updatedModalTask.category,
              deadLine: new Date(updatedModalTask.deadline).toISOString(),
              isFinished: updatedModalTask.isFinished,
            }
          : task
      )
    );
    handleCloseEditModal();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col">
      <header className="bg-white border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="text-black">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-6 sm:h-6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-black">Calendar</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 sm:p-4">
        {mainView === "calendar" && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-4 sm:mb-6 gap-1 sm:gap-2 bg-white rounded-xl p-1 sm:p-2 w-fit mx-auto border shadow-sm">
              <button onClick={() => setCalendarView("month")} className={`hover:cursor-pointer px-3 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${calendarView === "month" ? "bg-blue-600 text-white" : "bg-transparent text-neutral-600 hover:text-black"}`}>
                Month View
              </button>
              <button onClick={() => setCalendarView("week")} className={`hover:cursor-pointer px-3 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${calendarView === "week" ? "bg-blue-600 text-white" : "bg-transparent text-neutral-600 hover:text-black"}`}>
                Week View
              </button>
              <button onClick={() => setCalendarView("day")} className={`hover:cursor-pointer px-3 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${calendarView === "day" ? "bg-blue-600 text-white" : "bg-transparent text-neutral-600 hover:text-black"}`}>
                Day View
              </button>
            </div>

            {calendarView === "month" && (
              <CalendarMonth
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                tasks={tasks}
                categories={settings.categories || {}}
                weekStart={settings.weekStart}
                onDateClick={(date) => {
                  setSelectedDate(date);
                }}
                selectedDate={selectedDate}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onOpenEditModal={handleOpenEditModal}
              />
            )}
          </div>
        )}
      </main>

      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleSaveEditedTask}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
}
