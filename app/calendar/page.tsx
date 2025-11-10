"use client";

import React, { useState } from "react";
import "./calendar.css"; // นี่คือไฟล์ CSS ธีมมืดที่คุณเพิ่งส่งมา
import CalendarDay from "@/app/components/CalendarDay";
type Event = {
  title: string;
  time: string;
  description?: string;
};

type EventMap = {
  [date: string]: Event[];
};

const events: EventMap = {
  "2024-11-17": [{ title: "Homework1", time: "12:00", description: "Description" }],
  "2024-11-16": [{ title: "Meeting", time: "09:00" }],
  "2024-11-20": [{ title: "Party", time: "19:00" }],
  // (สมมติว่าวันนี้คือ 10 พ.ย. 2025)
  "2025-11-10": [{ title: "Today's Task", time: "10:00" }],
};

const WeekView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const [selectedDay, setSelectedDay] = useState<string>(ymd(new Date()));

  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 1 = Monday, 0 = Sunday
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
  };

  const monday = getMonday(selectedDate);

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedDate);
    nextWeek.setDate(selectedDate.getDate() + 7);
    setSelectedDate(nextWeek);
  };

  const goToPrevWeek = () => {
    const prevWeek = new Date(selectedDate);
    prevWeek.setDate(selectedDate.getDate() - 7);
    setSelectedDate(prevWeek);
  };

  const renderWeek = () => {
    const week = [];
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const iso = ymd(current);

      const hasEvent = events[iso];
      const isSelected = selectedDay === iso;
      const isToday = ymd(new Date()) === iso;

      week.push(
        <div
          key={iso}
          className={`day-col ${isSelected ? "selected" : ""} ${
            isToday ? "today" : ""
          }`}
          onClick={() => setSelectedDay(iso)}
        >
          {/* (แก้ไข) ปรับโครงสร้างนี้ให้ตรงกับ CSS .day-header ที่เป็น flex */}
          <div className="day-header">
            <strong>{weekdays[i]}</strong>
            <div className="day-num">{current.getDate()}</div>
          </div>
          
          {/* .event-dot ใน CSS ใหม่เป็น position: absolute 
              ดังนั้นวางไว้ตรงนี้ได้เลย */}
          {hasEvent && <div className="event-dot"></div>}
        </div>
      );
    }

    return week;
  };

  const renderTasks = () => {
    if (!selectedDay || !events[selectedDay])
      // (แก้ไข) ปรับข้อความให้เข้ากับธีม
      return <div style={{ color: "#999" }}>No tasks for this day</div>;

    return events[selectedDay].map((ev, idx) => (
      <div key={idx} className="event-card">
        {/* (แก้ไข) .event-card เป็น flex, 
            ใช้ <strong> แทน .fw-bold 
            และเช็คว่ามี description ไหม */}
        <div>
          <strong>{ev.title}</strong>
          {ev.description && <div className="desc">{ev.description}</div>}
        </div>
        <div className="time">{ev.time}</div>
      </div>
    ));
  };

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        {/* (แก้ไข) ย้ายปุ่มไปไว้ใน div นี้เพื่อให้จัดสไตล์ง่ายขึ้น */}
        <div className="navigation-controls">
          <button onClick={goToPrevWeek}>&lt;</button>
          <span>
            {monday.toLocaleString("default", { month: "long" })}{" "}
            {monday.getFullYear()}
          </span>
          <button onClick={goToNextWeek}>&gt;</button>
        </div>
      </header>

      <div className="week-grid">{renderWeek()}</div>

      <h5 className="task-title">Task</h5>
      <div className="task-list">{renderTasks()}</div>
    </div>
  );
};

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ตัวอย่าง categories สำหรับ Day View
  const categories = {
    work: { color: "#3b82f6" },
    personal: { color: "#22c55e" },
  };

  // mock task list สำหรับ Day View
  const tasks = [
    {
      id: "1",
      title: "Meeting",
      start: "2025-11-10T09:00",
      end: "2025-11-10T10:00",
      category: "work",
    },
    {
      id: "2",
      title: "Gym",
      start: "2025-11-10T18:00",
      allDay: false,
      category: "personal",
    },
  ];

  return (
    <div className="calendar-container">
      {/* ปุ่มเลือกโหมด */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, gap: 8 }}>
        <button
          onClick={() => setView("week")}
          style={{
            background: view === "week" ? "#3b82f6" : "#333",
            color: "white",
            borderRadius: 8,
            padding: "8px 16px",
            border: "none",
          }}
        >
          Week View
        </button>
        <button
          onClick={() => setView("day")}
          style={{
            background: view === "day" ? "#3b82f6" : "#333",
            color: "white",
            borderRadius: 8,
            padding: "8px 16px",
            border: "none",
          }}
        >
          Day View
        </button>
      </div>

      {view === "week" ? (
        <WeekView
          onSelectDay={(d) => {
            setSelectedDate(d);
            setView("day");
          }}
        />
      ) : (
        <CalendarDay
          year={selectedDate.getFullYear()}
          month={selectedDate.getMonth()}
          day={selectedDate.getDate()}
          tasks={tasks}
          categories={categories}
        />
      )}
    </div>
  );
}
