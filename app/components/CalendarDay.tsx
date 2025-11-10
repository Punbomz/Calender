"use client";
import { useMemo, useState } from "react";

type Task = { 
  id: string; 
  title: string; 
  start: string; 
  end?: string; 
  allDay?: boolean; 
  category?: string;
  description?: string;
};
type Categories = Record<string, { color: string }>;

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateInTask(date: Date, t: Task) {
  const s = new Date(t.start);
  const e = t.end ? new Date(t.end) : s;
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return dayEnd >= s && dayStart <= e;
}

export default function CalendarDay({
  year,
  month,
  day,
  tasks,
  categories,
}: {
  year: number;
  month: number;
  day: number;
  tasks: Task[];
  categories: Categories;
}) {
  const [cursor, setCursor] = useState(new Date(year, month, day));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const nav = (d: number) => {
    const x = new Date(cursor);
    x.setDate(x.getDate() + d);
    setCursor(x);
  };

  const goToToday = () => setCursor(new Date());

  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => dateInTask(cursor, t))
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
  }, [cursor, tasks]);

  const allDayTasks = dayTasks.filter((t) => t.allDay);
  const timedTasks = dayTasks.filter((t) => !t.allDay);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const isToday = formatDate(cursor) === formatDate(new Date());

  return (
    <div className="w-full bg-neutral-950 text-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-950 z-10 pb-4 pt-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <button
            onClick={() => nav(-1)}
            className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
          >
            ‹
          </button>
          <div className="text-center">
            <h2 className="text-lg sm:text-2xl font-bold">
              {cursor.toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <button
              onClick={goToToday}
              className="text-xs sm:text-sm text-neutral-400 hover:text-white mt-1"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => nav(1)}
            className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
          >
            ›
          </button>
        </div>

        {/* All-day events */}
        {allDayTasks.length > 0 && (
          <div className="bg-neutral-900 rounded-xl p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold mb-2 text-neutral-400">
              All Day
            </h3>
            <div className="space-y-2">
              {allDayTasks.map((task) => {
                const cat = categories[task.category || "personal"];
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-2 sm:p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: cat?.color + "20",
                      borderLeft: `4px solid ${cat?.color || "#888"}`,
                    }}
                  >
                    <div className="font-medium text-sm sm:text-base">{task.title}</div>
                    {task.description && (
                      <div className="text-xs sm:text-sm text-neutral-400 mt-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time grid */}
      <div className="bg-neutral-900 rounded-xl overflow-hidden">
        {hours.map((hour) => {
          const hourStr = String(hour).padStart(2, "0") + ":00";
          const hourTasks = timedTasks.filter((t) => {
            const taskHour = new Date(t.start).getHours();
            return taskHour === hour;
          });

          return (
            <div
              key={hour}
              className="flex border-b border-neutral-800 min-h-[50px] sm:min-h-[60px]"
            >
              <div className="w-12 sm:w-20 flex-shrink-0 p-2 text-right text-xs sm:text-sm text-neutral-500">
                {hourStr}
              </div>
              <div className="flex-1 p-2 relative">
                {hourTasks.length > 0 ? (
                  <div className="space-y-1">
                    {hourTasks.map((task) => {
                      const cat = categories[task.category || "personal"];
                      const startTime = new Date(task.start);
                      const endTime = task.end
                        ? new Date(task.end)
                        : new Date(startTime.getTime() + 60 * 60 * 1000);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="p-2 sm:p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            backgroundColor: cat?.color || "#888",
                          }}
                        >
                          <div className="font-medium text-xs sm:text-sm">
                            {task.title}
                          </div>
                          <div className="text-[10px] sm:text-xs opacity-90 mt-1">
                            {startTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {endTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {task.description && (
                            <div className="text-[10px] sm:text-xs opacity-80 mt-1 hidden sm:block">
                              {task.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full hover:bg-neutral-800 rounded cursor-pointer transition-colors" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No tasks message */}
      {dayTasks.length === 0 && (
        <div className="text-center text-neutral-500 py-12 text-sm sm:text-base">
          No tasks for this day
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-neutral-900 rounded-xl p-4 sm:p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold">{selectedTask.title}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-neutral-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm sm:text-base">
              <div>
                <div className="text-xs sm:text-sm text-neutral-400">Time</div>
                <div>
                  {selectedTask.allDay
                    ? "All Day"
                    : `${new Date(selectedTask.start).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}${
                        selectedTask.end
                          ? " - " +
                            new Date(selectedTask.end).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                      }`}
                </div>
              </div>
              {selectedTask.category && (
                <div>
                  <div className="text-xs sm:text-sm text-neutral-400">Category</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          categories[selectedTask.category]?.color || "#888",
                      }}
                    />
                    {selectedTask.category}
                  </div>
                </div>
              )}
              {selectedTask.description && (
                <div>
                  <div className="text-xs sm:text-sm text-neutral-400">Description</div>
                  <div>{selectedTask.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}