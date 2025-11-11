"use client";
import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Archive,
  User,
  Plus,
  X,
  Check,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";

import EditTaskModal from "../task/EditTask";

// --- Types ---
type Task = {
  id: string;
  taskName: string;
  start: string;
  end?: string;
  category?: string;
  description?: string;
  isFinished?: boolean;
  deadLine: string; // ISO String
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
    // แก้ไข Z-index
    <div className={`relative inline-block ${showMenu ? 'z-20' : 'z-auto'}`} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu((prev) => !prev);
        }}
        className="hover:cursor-pointer p-2 rounded-md text-white hover:bg-white/20 transition"
        aria-label={`Options for ${task.taskName}`}
      >
        <MoreHorizontal size={18} />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-36 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ปุ่ม Edit (ลบ hover bg) */}
          <button
            onClick={() => {
              setShowMenu(false);
              handleEditTask(task);
            }}
            className="hover: cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit size={16} />
            Edit
          </button>
          {/* ปุ่ม Delete */}
          <button
            onClick={() => {
              setShowMenu(false);
              confirmDelete();
            }}
            className="hover: cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600 transition"
          >
            <Trash2 size={16} />
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
      <div className="w-full bg-neutral-900 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 gap-2"> <button onClick={() => nav(-1)} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"> ‹ </button> <h2 className="text-xl font-semibold text-white"> {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })} </h2> <button onClick={() => nav(1)} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"> › </button> </div> <div className="grid grid-cols-7 text-center text-sm text-neutral-400 mb-2"> {weekLabels.map((w) => (<div key={w} className="py-2"> {w} </div>))} </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((date, i) => {
            const isOther = date.getMonth() !== cursor.getMonth();
            const isToday = sameDay(date, today);
            const isSelected = selectedDate && sameDay(date, selectedDate);
            const dayTasks = tasks.filter((t) => !t.isFinished && dateInTask(date, t));
            const sortedDayTasks = dayTasks.sort((a, b) => b.priorityLevel - a.priorityLevel);
            const dots = sortedDayTasks.slice(0, 3).map((t) => priorityColors[t.priorityLevel] || defaultColor);
            return (
              <div key={i} onClick={() => onDateClick && onDateClick(date)} className={`rounded-xl p-3 min-h-[80px] cursor-pointer transition-all ${isOther ? "bg-neutral-800 opacity-40" : "bg-neutral-800 hover:bg-neutral-700"} ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
                <div className="flex items-center justify-between mb-2"> <div className={`text-sm ${isToday ? "bg-white text-black rounded-full w-7 h-7 flex items-center justify-center font-bold" : "text-white"}`}> {date.getDate()} </div> </div>
                <div className="flex gap-1 flex-wrap"> {dots.map((c, idx) => (<span key={idx} className="w-2 h-2 rounded-full" style={{ background: c }} />))} {dayTasks.length > 3 && (<span className="text-xs text-neutral-400">+{dayTasks.length - 3}</span>)} </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-2xl p-6 mt-4">
        <h5 className="text-3xl font-bold mb-4 text-white">
          Tasks for{" "} {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Selected Day"}
        </h5>
        {selectedDayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">
            {selectedDate ? "No unfinished tasks for this day" : "Click a date to see tasks"}
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel)
              .map((task) => (
                <div key={task.id} className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundColor: priorityColors[task.priorityLevel] || defaultColor }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, task.isFinished || false); }} className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
                        {task.isFinished && (<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /> </svg>)}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <h3 className={`text-xl truncate font-bold leading-tight ${task.isFinished ? 'line-through' : ''}`}>
                        {task.taskName}
                      </h3>
                      {/* --- ⭐️ 1. แก้ไข: ลบ opacity-90 --- */}
                      <div className="flex items-center gap-2 ml-4 whitespace-nowrap text-sm">
                        <Calendar size={16} className="hidden sm:inline" />
                        <p className="hidden sm:inline">{formatTaskDate(task.deadLine)}</p>
                        <Clock size={16} />
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

// --- Week View Component ---
function WeekView({
  selectedDate,
  onDateChange,
  tasks,
  onSelectDay,
  onToggleTask,
  onDeleteTask,
  onOpenEditModal,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  categories: Categories;
  onSelectDay: (date: Date) => void;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenEditModal: (task: Task) => void;
}) {
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(ymd(selectedDate));
  useEffect(() => { setSelectedDay(ymd(selectedDate)); }, [selectedDate]);
  const getMonday = (d: Date) => { const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; const monday = new Date(d); monday.setDate(d.getDate() + diff); return monday; };
  const monday = getMonday(selectedDate);
  const goToNextWeek = () => { const nextWeek = new Date(selectedDate); nextWeek.setDate(selectedDate.getDate() + 7); onDateChange(nextWeek); };
  const goToPrevWeek = () => { const prevWeek = new Date(selectedDate); prevWeek.setDate(selectedDate.getDate() - 7); onDateChange(prevWeek); };
  const handleDayClick = (iso: string, date: Date) => { setSelectedDay(iso); onSelectDay(date); };
  const renderWeek = () => {
    const week = []; const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday); current.setDate(monday.getDate() + i); const iso = ymd(current);
      const dayTasks = tasks.filter((t) => { if (t.isFinished) return false; const taskDate = new Date(t.deadLine); return ymd(taskDate) === iso; });
      const isSelected = selectedDay === iso; const isToday = ymd(new Date()) === iso;
      week.push(
        <div key={iso} className={`relative rounded-xl p-4 cursor-pointer transition-all min-h-[100px] ${isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-neutral-800 hover:bg-neutral-700"} ${isToday ? "ring-2 ring-white" : ""}`} onClick={() => handleDayClick(iso, current)}>
          <div className="flex flex-col items-center mb-3"> <strong className="text-neutral-400 text-xs">{weekdays[i]}</strong> <div className={`text-lg font-semibold mt-1 ${isToday && !isSelected ? "bg-white text-black rounded-full w-8 h-8 flex items-center justify-center" : "text-white"}`}> {current.getDate()} </div> </div>
          {dayTasks.length > 0 && (<div className="flex gap-1 justify-center flex-wrap"> {dayTasks.sort((a, b) => b.priorityLevel - a.priorityLevel).slice(0, 3).map((task, idx) => (<div key={idx} className="w-2 h-2 rounded-full" style={{ background: priorityColors[task.priorityLevel] || defaultColor }}/>))} {dayTasks.length > 3 && <span className="text-xs text-neutral-400">+{dayTasks.length - 3}</span>} </div>)}
        </div>,
      );
    } return week;
  };
  const selectedDayTasks = tasks.filter((t) => { if (t.isFinished) return false; const taskDate = new Date(t.deadLine); return ymd(taskDate) === selectedDay; });

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4"> <button onClick={goToPrevWeek} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"> ‹ </button> <h2 className="text-xl font-semibold text-white"> {monday.toLocaleString("default", { month: "long" })} {monday.getFullYear()} </h2> <button onClick={goToNextWeek} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"> › </button> </div>
        <div className="grid grid-cols-7 gap-2">{renderWeek()}</div>
      </div>

      <div className="bg-neutral-900 rounded-2xl p-6">
        <h5 className="text-3xl font-bold mb-4 text-white">Tasks</h5>
        {selectedDayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">No unfinished tasks for this day</div>
        ) : (
          <div className="space-y-4">
            {selectedDayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel)
              .map((task) => (
                <div key={task.id} className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundColor: priorityColors[task.priorityLevel] || defaultColor }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, task.isFinished || false); }} className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
                        {task.isFinished && (<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /> </svg>)}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <h3 className={`text-xl truncate font-bold leading-tight ${task.isFinished ? 'line-through' : ''}`}>
                        {task.taskName}
                      </h3>
                      {/* --- ⭐️ 2. แก้ไข: ลบ opacity-90 --- */}
                      <div className="flex items-center gap-2 ml-4 whitespace-nowrap text-sm">
                        <Calendar size={16} className="hidden sm:inline" />
                        <p className="hidden sm:inline">{formatTaskDate(task.deadLine)}</p>
                        <Clock size={16} />
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

// --- Day View Component ---
function DayView({
  selectedDate,
  tasks,
  onDateChange,
  onToggleTask,
  onDeleteTask,
  onOpenEditModal,
}: {
  selectedDate: Date;
  tasks: Task[];
  categories: Categories;
  onDateChange: (date: Date) => void;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenEditModal: (task: Task) => void;
}) {
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const goToNextDay = () => { const nextDay = new Date(selectedDate); nextDay.setDate(selectedDate.getDate() + 1); onDateChange(nextDay); };
  const goToPrevDay = () => { const prevDay = new Date(selectedDate); prevDay.setDate(selectedDate.getDate() - 1); onDateChange(prevDay); };
  const dayTasks = tasks.filter((t) => { if (t.isFinished) return false; const taskDate = new Date(t.deadLine); return ymd(taskDate) === ymd(selectedDate); });

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4"> <button onClick={goToPrevDay} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"> ‹ </button> <h2 className="text-xl font-semibold text-white"> {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", })} </h2> <button onClick={goToNextDay} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"> › </button> </div>
      </div>

      <div className="bg-neutral-900 rounded-2xl p-6">
        <h5 className="text-3xl font-bold mb-4 text-white">Tasks</h5>
        {dayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">No unfinished tasks for this day</div>
        ) : (
          <div className="space-y-4">
            {dayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel)
              .map((task) => (
                <div key={task.id} className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundColor: priorityColors[task.priorityLevel] || defaultColor }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, task.isFinished || false); }} className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
                        {task.isFinished && (<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /> </svg>)}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <h3 className={`text-xl truncate font-bold leading-tight ${task.isFinished ? 'line-through' : ''}`}>
                        {task.taskName}
                      </h3>
                      {/* --- ⭐️ 3. แก้ไข: ลบ opacity-90 --- */}
                      <div className="flex items-center gap-2 ml-4 whitespace-nowrap text-sm">
                        <Calendar size={16} className="hidden sm:inline" />
                        <p className="hidden sm:inline">{formatTaskDate(task.deadLine)}</p>
                        <Clock size={16} />
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

  const loadTasks = async () => {
    try {
      setError(null);
      const response = await fetch("/api/task/gettask?isFinished=false");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      if (data.success) setTasks(data.tasks);
      else throw new Error(data.error || "Failed to load tasks");
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true); // Set loading true only on initial load
    loadTasks();
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isFinished: !currentStatus } : task
      )
    );
    try {
      const response = await fetch("/api/task/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ taskId, isFinished: !currentStatus, }), });
      if (!response.ok) { throw new Error("Failed to update task"); }
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
      const response = await fetch("/api/task/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ taskId }), });
      if (!response.ok) { throw new Error("Failed to delete task"); }
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
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3"> <button className="text-black"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> <line x1="3" y1="6" x2="21" y2="6" /> <line x1="3" y1="12" x2="21" y2="12" /> <line x1="3" y1="18" x2="21" y2="18" /> </svg> </button> <h1 className="text-2xl font-bold text-black">Calendar</h1> </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {mainView === "calendar" && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6 gap-2 bg-white rounded-xl p-2 w-fit mx-auto border shadow-sm"> <button onClick={() => setCalendarView("month")} className={`px-6 py-2 rounded-lg font-medium transition-all ${calendarView === "month" ? "bg-blue-600 text-white" : "bg-transparent text-neutral-600 hover:text-black"}`}> Month View </button> <button onClick={() => setCalendarView("week")} className={`px-6 py-2 rounded-lg font-medium transition-all ${calendarView === "week" ? "bg-blue-600 text-white" : "bg-transparent text-neutral-600 hover:text-black"}`}> Week View </button> <button onClick={() => setCalendarView("day")} className={`px-6 py-2 rounded-lg font-medium transition-all ${calendarView === "day" ? "bg-blue-600 text-white" : "bg-transparent text-neutral-600 hover:text-black"}`}> Day View </button> </div>

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

            {calendarView === "week" && (
              <WeekView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                tasks={tasks}
                categories={settings.categories || {}}
                onSelectDay={(date) => {
                  setSelectedDate(date);
                }}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onOpenEditModal={handleOpenEditModal}
              />
            )}

            {calendarView === "day" && (
              <DayView
                selectedDate={selectedDate}
                tasks={tasks}
                categories={settings.categories || {}}
                onDateChange={setSelectedDate}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onOpenEditModal={handleOpenEditModal}
              />
            )}
          </div>
        )}

        {mainView === "tasks" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-neutral-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Unfinished Tasks</h2>
              </div>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-neutral-400 text-center py-8">No unfinished tasks</div>
                ) : (
                  tasks
                    .sort((a, b) => b.priorityLevel - a.priorityLevel)
                    .map((task) => (
                      <div key={task.id} className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundColor: priorityColors[task.priorityLevel] || defaultColor }}>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <button onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id, task.isFinished || false); }} className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
                              {task.isFinished && (<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /> </svg>)}
                            </button>
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <h3 className={`text-xl truncate font-bold leading-tight ${task.isFinished ? 'line-through' : ''}`}>
                              {task.taskName}
                            </h3>
                            {/* --- ⭐️ 4. แก้ไข: ลบ opacity-90 --- */}
                            <div className="flex items-center gap-2 ml-4 whitespace-nowrap text-sm">
                              <Calendar size={16} className="hidden sm:inline" />
                              <p className="hidden sm:inline">{formatTaskDate(task.deadLine)}</p>
                              <Clock size={16} />
                              <span className="font-semibold">{formatTaskTime(task.deadLine)}</span>
                              <TaskMenuButton
                                task={task}
                                handleDeleteTask={handleDeleteTask}
                                handleEditTask={handleOpenEditModal}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {mainView === "profile" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-neutral-900 rounded-2xl p-6"> <h2 className="text-2xl font-bold mb-6 text-white">Profile</h2> <div className="flex flex-col items-center gap-4"> <div className="w-24 h-24 bg-neutral-700 rounded-full flex items-center justify-center"> <User size={48} className="text-neutral-400" /> </div> <div className="text-center"> <p className="text-neutral-400"> Profile information will be managed by your external authentication system. </p> </div> </div> </div>
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
