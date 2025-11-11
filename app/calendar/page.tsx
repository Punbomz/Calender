"use client";
import { useState, useEffect } from "react";
import { Calendar, Archive, User, Plus, X, Check } from "lucide-react";

// Types
type Task = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  category?: string;
  description?: string;
  completed?: boolean;
};

type Categories = Record<string, { color: string }>;

type Settings = {
  weekStart?: "Mon" | "Sun";
  categories?: Categories;
};

// Calendar Month Component
function CalendarMonth({
  year,
  month,
  tasks,
  categories,
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
  selectedDate?: Date | null;
}) {
  const [cursor, setCursor] = useState(new Date(year, month, 1));

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
    const s = new Date(t.start);
    const e = t.end ? new Date(t.end) : s;
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    return dayEnd >= s && dayStart <= e;
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

  return (
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
          const isSelected = selectedDate && sameDay(date, selectedDate);
          const dayTasks = tasks.filter((t) => dateInTask(date, t));
          const dots = dayTasks.slice(0, 3).map((t) => categories[t.category || "personal"]?.color || "#888");

          return (
            <div
              key={i}
              onClick={() => onDateClick && onDateClick(date)}
              className={`rounded-xl p-3 min-h-[80px] cursor-pointer transition-all ${
                isOther ? "bg-neutral-800 opacity-40" : "bg-neutral-800 hover:bg-neutral-750"
              } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-sm ${isToday ? "bg-white text-black rounded-full w-7 h-7 flex items-center justify-center font-bold" : "text-white"}`}
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
  );
}

// Week View Component
function WeekView({
  selectedDate,
  onDateChange,
  tasks,
  categories,
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
        const taskDate = new Date(t.start);
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
              {dayTasks.slice(0, 3).map((task, idx) => (
                <div
                  key={idx}
                  className="w-2 h-2 rounded-full"
                  style={{ background: categories[task.category || "personal"]?.color || "#888" }}
                />
              ))}
              {dayTasks.length > 3 && <span className="text-xs text-neutral-400">+{dayTasks.length - 3}</span>}
            </div>
          )}
        </div>
      );
    }

    return week;
  };

  const selectedDayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.start);
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
          <div className="text-neutral-400 text-center py-8">No tasks for this day</div>
        ) : (
          <div className="space-y-3">
            {selectedDayTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{
                  backgroundColor: categories[task.category || "personal"]?.color || "#888",
                }}
              >
                <div>
                  <strong className="text-white">{task.title}</strong>
                  {task.description && <div className="text-sm text-white opacity-90 mt-1">{task.description}</div>}
                </div>
                <div className="text-sm text-white opacity-75">
                  {new Date(task.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Day View Component
function DayView({
  selectedDate,
  tasks,
  categories,
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
    const taskDate = new Date(t.start);
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
          <div className="text-neutral-400 text-center py-8">No tasks for this day</div>
        ) : (
          <div className="space-y-3">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: categories[task.category || "personal"]?.color || "#888",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{task.title}</h4>
                    {task.description && <p className="text-sm mt-1 text-white opacity-90">{task.description}</p>}
                    <p className="text-sm mt-2 text-white opacity-75">
                      {new Date(task.start).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {task.end &&
                        ` - ${new Date(task.end).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
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
  const [settings, setSettings] = useState<Settings>({
    weekStart: "Mon",
    categories: {
      personal: { color: "#ef4444" },
      work: { color: "#3b82f6" },
      health: { color: "#22c55e" },
      other: { color: "#f59e0b" },
    },
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "personal",
    date: "",
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedTasks = localStorage.getItem("calendar-tasks");
      const savedSettings = localStorage.getItem("calendar-settings");

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        const demoTasks: Task[] = [
          {
            id: "1",
            title: "Team Meeting",
            start: "2025-11-08T10:00:00",
            category: "work",
            description: "Weekly sync",
          },
          {
            id: "2",
            title: "Gym",
            start: "2025-11-09T18:00:00",
            category: "health",
          },
          {
            id: "3",
            title: "Project Deadline",
            start: "2025-11-12T23:59:00",
            category: "work",
            description: "Submit final report",
          },
          {
            id: "4",
            title: "Homework1",
            start: "2024-11-17T12:00:00",
            category: "personal",
            description: "Description",
          },
          {
            id: "5",
            title: "Doctor Appointment",
            start: "2025-11-20T14:00:00",
            category: "health",
          },
          {
            id: "6",
            title: "Birthday Party",
            start: "2025-11-28T19:00:00",
            category: "personal",
          },
        ];
        setTasks(demoTasks);
        localStorage.setItem("calendar-tasks", JSON.stringify(demoTasks));
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("calendar-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddTask = () => {
    if (!newTask.title || !newTask.date) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      start: new Date(newTask.date).toISOString(),
      category: newTask.category,
      description: newTask.description,
    };

    setTasks([...tasks, task]);
    setIsAddingTask(false);
    setNewTask({ title: "", description: "", category: "personal", date: "" });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-black border-b border-neutral-800 p-4">
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
            {/* Calendar View Selector */}
            <div className="flex justify-center mb-6 gap-2 bg-neutral-900 rounded-xl p-2 w-fit mx-auto">
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

            {/* Render appropriate view */}
            {calendarView === "month" && (
              <CalendarMonth
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                tasks={tasks}
                categories={settings.categories || {}}
                weekStart={settings.weekStart}
                onDateClick={(date) => {
                  setSelectedDate(date);
                  setCalendarView("day");
                }}
                selectedDate={selectedDate}
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
                  setCalendarView("day");
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

        {mainView === "tasks" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-neutral-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Task
                </button>
              </div>

              {isAddingTask && (
                <div className="bg-neutral-800 rounded-xl p-4 mb-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-neutral-700 rounded-lg px-4 py-2 mb-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full bg-neutral-700 rounded-lg px-4 py-2 mb-3 text-white"
                  />
                  <input
                    type="datetime-local"
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    className="w-full bg-neutral-700 rounded-lg px-4 py-2 mb-3 text-white"
                  />
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full bg-neutral-700 rounded-lg px-4 py-2 mb-3 text-white"
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddTask}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTask(false);
                        setNewTask({ title: "", description: "", category: "personal", date: "" });
                      }}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: settings.categories?.[task.category || "personal"]?.color || "#888",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button onClick={() => handleToggleTask(task.id)} className="mt-1 flex-shrink-0">
                          {task.completed ? (
                            <div className="w-5 h-5 rounded border-2 border-white bg-white flex items-center justify-center">
                              <Check size={14} className="text-black" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded border-2 border-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${task.completed ? "line-through" : ""}`}>
                            {task.title}
                          </h4>
                          {task.description && <p className="text-sm mt-1 opacity-90">{task.description}</p>}
                          <p className="text-sm mt-2 opacity-75">
                            {new Date(task.start).toLocaleDateString("en-US", {
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
                ))}
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
                <p className="text-neutral-400">Profile settings coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-black border-t border-neutral-800 p-4">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => setMainView("calendar")}
            className={`flex flex-col items-center gap-1 ${mainView === "calendar" ? "text-white" : "text-neutral-400"}`}
          >
            <Calendar size={24} />
            <span className="text-xs">Calendar</span>
          </button>
          <button
            onClick={() => setMainView("tasks")}
            className={`flex flex-col items-center gap-1 ${mainView === "tasks" ? "text-white" : "text-neutral-400"}`}
          >
            <Archive size={24} />
            <span className="text-xs">Tasks</span>
          </button>
          <button
            onClick={() => setMainView("profile")}
            className={`flex flex-col items-center gap-1 ${mainView === "profile" ? "text-white" : "text-neutral-400"}`}
          >
            <User size={24} />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
