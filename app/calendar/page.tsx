"use client";
import { useState, useEffect } from "react";
import { Calendar, Archive, User, Plus, X, Check } from "lucide-react";

// Types
type Task = {
  id: string;
  taskName: string;
  start: string;
  end?: string;
  category?: string;
  description?: string;
  isFinished?: boolean;
  deadLine: string;
  priorityLevel: number;
};

type Categories = Record<string, { color: string }>;

type Settings = {
  weekStart?: "Mon" | "Sun";
  categories?: Categories;
};

// ตัวแปรสีที่ใช้ร่วมกัน
const priorityColors: Record<number, string> = {
  3: "#ef4444", // Red (High)
  2: "#f59e0b", // Yellow/Amber (Medium)
  1: "#22c55e", // Green (Low)
};
const defaultColor = "#888"; // สีสำรอง

// --- 1. แก้ไข CalendarMonth Component ทั้งหมด ---

// Calendar Month Component
function CalendarMonth({
  year,
  month,
  tasks,
  // categories,
  weekStart = "Mon",
  onDateClick,
  selectedDate,
}: {
  year: number;
  month: number;
  tasks: Task[];
  categories: Categories;
  weekStart?: "Mon" | "Sun";
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null; // รับ selectedDate มาเพื่อใช้กรอง
}) {
  const [cursor, setCursor] = useState(new Date(year, month, 1));

  // Helper function (ยืมมาจาก DayView)
  function ymd(d: Date | null) {
    if (!d) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  }

  function startOfWeek(d: Date, weekStart: "Mon" | "Sun") {
    const day = d.getDay();
    const diff = weekStart === "Mon" ? (day === 0 ? -6 : 1 - day) : -day;
    const nd = new Date(d);
    nd.setDate(d.getDate() + diff);
    nd.setHours(0, 0, 0, 0);
    return nd;
  }

  function monthMatrix(year: number, month: number, weekStart: "Mon" | "Sun") {
    const first = new Date(year, month, 1);
    const firstCell = startOfWeek(first, weekStart);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(firstCell);
      d.setDate(firstCell.getDate() + i);
      return d;
    });
  }

  function dateInTask(date: Date, t: Task) {
    const taskDate = new Date(t.deadLine);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    return taskDate >= dayStart && taskDate <= dayEnd;
  }

  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  const cells = monthMatrix(cursor.getFullYear(), cursor.getMonth(), weekStart);
  const weekLabels = weekStart === "Mon"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nav = (d: number) => {
    const x = new Date(cursor);
    x.setMonth(x.getMonth() + d);
    setCursor(x);
  };

  const today = new Date();

  // --- ตรรกะใหม่: กรอง Task สำหรับวันที่ถูกเลือก ---
  const selectedDayTasks = tasks.filter((t) => {
    if (t.isFinished || !selectedDate) return false;
    const taskDate = new Date(t.deadLine);
    return ymd(taskDate) === ymd(selectedDate);
  });
  // --- จบตรรกะใหม่ ---

  return (
    // --- เพิ่ม Wrapper div ---
    <div className="w-full">
      {/* ปฏิทิน (โค้ดเดิม) */}
      <div className="w-full bg-neutral-900 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={() => nav(-1)}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            ‹
          </button>
          <h2 className="text-xl font-semibold text-white">
            {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => nav(1)}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-sm text-neutral-400 mb-2">
          {weekLabels.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((date, i) => {
            const isOther = date.getMonth() !== cursor.getMonth();
            const isToday = sameDay(date, today);
            const isSelected = selectedDate && sameDay(date, selectedDate); // ไฮไลท์ยังทำงานเหมือนเดิม
            const dayTasks = tasks.filter((t) => !t.isFinished && dateInTask(date, t));
            const sortedDayTasks = dayTasks.sort((a, b) => b.priorityLevel - a.priorityLevel);
            const dots = sortedDayTasks
              .slice(0, 3)
              .map((t) => priorityColors[t.priorityLevel] || defaultColor);

            return (
              <div
                key={i}
                onClick={() => onDateClick && onDateClick(date)} // onClick ยังเรียก prop เหมือนเดิม
                className={`rounded-xl p-3 min-h-[80px] cursor-pointer transition-all ${
                  isOther ? "bg-neutral-800 opacity-40" : "bg-neutral-800 hover:bg-neutral-750"
                } ${isSelected ? "ring-2 ring-blue-500" : ""}`} // 'isSelected' ยังคงไฮไลท์วัน
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`text-sm ${
                      isToday ? "bg-white text-black rounded-full w-7 h-7 flex items-center justify-center font-bold" : "text-white"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {dots.map((c, idx) => (
                    <span key={idx} className="w-2 h-2 rounded-full" style={{ background: c }} />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-xs text-neutral-400">+{dayTasks.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- ส่วนแสดง Task List ที่เพิ่มเข้ามาใหม่ (ยืมจาก DayView) --- */}
      <div className="bg-neutral-900 rounded-2xl p-6 mt-4">
        <h5 className="text-lg font-semibold mb-4">
          Tasks for{" "}
          {selectedDate
            ? selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })
            : "Selected Day"}
        </h5>
        {selectedDayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">
            {selectedDate ? "No unfinished tasks for this day" : "Click a date to see tasks"}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel) // เรียง
              .map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: priorityColors[task.priorityLevel] || defaultColor, // ใช้สี
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{task.taskName}</h4>
                      {task.description && <p className="text-sm mt-1 text-white opacity-90">{task.description}</p>}
                      <p className="text-sm mt-2 text-white opacity-75">
                        {new Date(task.deadLine).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
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
// --- จบการแก้ไข CalendarMonth Component ---

// Week View Component (ไม่เปลี่ยนแปลง)
function WeekView({
  selectedDate,
  onDateChange,
  tasks,
  // categories,
  onSelectDay,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  categories: Categories;
  onSelectDay: (date: Date) => void;
}) {
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const [selectedDay, setSelectedDay] = useState<string>(ymd(selectedDate));

  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
  };

  const monday = getMonday(selectedDate);

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedDate);
    nextWeek.setDate(selectedDate.getDate() + 7);
    onDateChange(nextWeek);
  };

  const goToPrevWeek = () => {
    const prevWeek = new Date(selectedDate);
    prevWeek.setDate(selectedDate.getDate() - 7);
    onDateChange(prevWeek);
  };

  const handleDayClick = (iso: string, date: Date) => {
    setSelectedDay(iso);
    onSelectDay(date);
  };

  const renderWeek = () => {
    const week = [];
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const iso = ymd(current);

      const dayTasks = tasks.filter((t) => {
        if (t.isFinished) return false;
        const taskDate = new Date(t.deadLine);
        return ymd(taskDate) === iso;
      });

      const isSelected = selectedDay === iso;
      const isToday = ymd(new Date()) === iso;

      week.push(
        <div
          key={iso}
          className={`relative rounded-xl p-4 cursor-pointer transition-all min-h-[100px] ${
            isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-neutral-800 hover:bg-neutral-750"
          } ${isToday ? "ring-2 ring-white" : ""}`}
          onClick={() => handleDayClick(iso, current)}
        >
          <div className="flex flex-col items-center mb-3">
            <strong className="text-neutral-400 text-xs">{weekdays[i]}</strong>
            <div
              className={`text-lg font-semibold mt-1 ${
                isToday && !isSelected ? "bg-white text-black rounded-full w-8 h-8 flex items-center justify-center" : ""
              }`}
            >
              {current.getDate()}
            </div>
          </div>

          {dayTasks.length > 0 && (
            <div className="flex gap-1 justify-center flex-wrap">
              {dayTasks
                .sort((a, b) => b.priorityLevel - a.priorityLevel) // เรียง
                .slice(0, 3)
                .map((task, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 rounded-full"
                    style={{ background: priorityColors[task.priorityLevel] || defaultColor }} // ใช้สี
                  />
                ))}
              {dayTasks.length > 3 && <span className="text-xs text-neutral-400">+{dayTasks.length - 3}</span>}
            </div>
          )}
        </div>,
      );
    }

    return week;
  };

  const selectedDayTasks = tasks.filter((t) => {
    if (t.isFinished) return false;
    const taskDate = new Date(t.deadLine);
    return ymd(taskDate) === selectedDay;
  });

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevWeek}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            ‹
          </button>
          <h2 className="text-xl font-semibold text-white">
            {monday.toLocaleString("default", { month: "long" })} {monday.getFullYear()}
          </h2>
          <button
            onClick={goToNextWeek}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">{renderWeek()}</div>
      </div>

      <div className="bg-neutral-900 rounded-2xl p-6">
        <h5 className="text-lg font-semibold mb-4">Tasks</h5>
        {selectedDayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">No unfinished tasks for this day</div>
        ) : (
          <div className="space-y-3">
            {selectedDayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel) // เรียง
              .map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{
                    backgroundColor: priorityColors[task.priorityLevel] || defaultColor, // ใช้สี
                  }}
                >
                  <div>
                    <strong className="text-white">{task.taskName}</strong>
                    {task.description && <div className="text-sm text-white opacity-90 mt-1">{task.description}</div>}
                  </div>
                  <div className="text-sm text-white opacity-75">
                    {new Date(task.deadLine).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Day View Component (ไม่เปลี่ยนแปลง)
function DayView({
  selectedDate,
  tasks,
  // categories,
  onDateChange,
}: {
  selectedDate: Date;
  tasks: Task[];
  categories: Categories;
  onDateChange: (date: Date) => void;
}) {
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    onDateChange(nextDay);
  };

  const goToPrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(selectedDate.getDate() - 1);
    onDateChange(prevDay);
  };

  const dayTasks = tasks.filter((t) => {
    if (t.isFinished) return false;
    const taskDate = new Date(t.deadLine);
    return ymd(taskDate) === ymd(selectedDate);
  });

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevDay}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            ‹
          </button>
          <h2 className="text-xl font-semibold text-white">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={goToNextDay}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            ›
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-2xl p-6">
        <h5 className="text-lg font-semibold mb-4">Tasks</h5>
        {dayTasks.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">No unfinished tasks for this day</div>
        ) : (
          <div className="space-y-3">
            {dayTasks
              .sort((a, b) => b.priorityLevel - a.priorityLevel) // เรียง
              .map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: priorityColors[task.priorityLevel] || defaultColor, // ใช้สี
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{task.taskName}</h4>
                      {task.description && <p className="text-sm mt-1 text-white opacity-90">{task.description}</p>}
                      <p className="text-sm mt-2 text-white opacity-75">
                        {new Date(task.deadLine).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
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

// Main App Component
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
      S: { color: "#ef4444" },
      A: { color: "#f59e0b" },
      B: { color: "#3b82f6" },
      C: { color: "#22c55e" },
    },
  });

  // Load tasks from API (ไม่เปลี่ยนแปลง)
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/task/gettask?isFinished=false");

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();

        if (data.success) {
          setTasks(data.tasks);
        } else {
          throw new Error(data.error || "Failed to load tasks");
        }
      } catch (err: any) {
        console.error("Error loading tasks:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // (ส่วน handleToggleTask, handleDeleteTask, loading, error ไม่เปลี่ยนแปลง)
  const handleToggleTask = async (taskId: string) => {
    try {
      const response = await fetch("/api/task/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          isFinished: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error("Error toggling task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch("/api/task/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-black border-b border-neutral-800 p-4">
        {/* ... (Header code) ... */}
        <div className="flex items-center gap-3">
          <button className="text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {mainView === "calendar" && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6 gap-2 bg-neutral-900 rounded-xl p-2 w-fit mx-auto">
              {/* ... (Buttons: Month, Week, Day) ... */}
              <button
                onClick={() => setCalendarView("month")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  calendarView === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setCalendarView("week")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  calendarView === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setCalendarView("day")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  calendarView === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-neutral-400 hover:text-white"
                }`}
              >
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
                // --- 2. แก้ไข onDateClick ที่นี่ ---
                onDateClick={(date) => {
                  setSelectedDate(date); // แค่เลือกวันที่
                  // setCalendarView("day"); // ไม่ต้องเปลี่ยน View
                }}
                // --- จบส่วนแก้ไข ---
                selectedDate={selectedDate} // ส่ง prop นี้ไปเพื่อไฮไลท์และกรอง
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
                  //setCalendarView("day");
//
                }}
              />
            )}

            {calendarView === "day" && (
              <DayView
                selectedDate={selectedDate}
                tasks={tasks}
                categories={settings.categories || {}}
                onDateChange={setSelectedDate}
              />
            )}
          </div>
        )}

        {/* ... (mainView "tasks" และ "profile" ไม่เปลี่ยนแปลง) ... */}
        {mainView === "tasks" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-neutral-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Unfinished Tasks</h2>
              </div>

              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-neutral-400 text-center py-8">No unfinished tasks</div>
                ) : (
                  tasks
                    .sort((a, b) => b.priorityLevel - a.priorityLevel) // เรียง
                    .map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: priorityColors[task.priorityLevel] || defaultColor, // ใช้สี
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <button onClick={() => handleToggleTask(task.id)} className="mt-1 flex-shrink-0">
                              <div className="w-5 h-5 rounded border-2 border-white" />
                            </button>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{task.taskName}</h4>
                              {task.description && <p className="text-sm mt-1 opacity-90 text-white">{task.description}</p>}
                              <p className="text-sm mt-2 opacity-75 text-white">
                                Deadline:{" "}
                                {new Date(task.deadLine).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-white hover:text-neutral-200 ml-2"
                          >
                            <X size={18} />
                          </button>
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
            <div className="bg-neutral-900 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">Profile</h2>
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-neutral-700 rounded-full flex items-center justify-center">
                  <User size={48} className="text-neutral-400" />
                </div>
                <div className="text-center">
                  <p className="text-neutral-400">
                    Profile information will be managed by your external authentication system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
