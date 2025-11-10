"use client";
import { useMemo, useState } from "react";

type Task = { id:string; title:string; start:string; end?:string; allDay?:boolean; category?:string; };
type Categories = Record<string, { color: string }>;

function startOfWeek(d: Date, weekStart: "Mon" | "Sun") {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = weekStart === "Mon" ? (day === 0 ? -6 : 1 - day) : -day;
  const nd = new Date(d);
  nd.setDate(d.getDate() + diff);
  nd.setHours(0,0,0,0);
  return nd;
}

function monthMatrix(year:number, month:number, weekStart:"Mon"|"Sun") {
  const first = new Date(year, month, 1);
  const firstCell = startOfWeek(first, weekStart);
  return Array.from({length: 42}, (_,i)=> {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate()+i);
    return d;
  });
}

function sameDay(a:Date,b:Date){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function dateInTask(date:Date, t:Task){
  const s=new Date(t.start);
  const e=t.end? new Date(t.end) : s;
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23,59,59,999);
  // ครอบกรณี allDay/หลายวัน: นับว่าทับช่วงถ้าวันนี้ตัดกับ [s,e]
  return dayEnd >= s && dayStart <= e;
}

export default function CalendarMonth({
  year, month, tasks, categories, weekStart="Mon"
}: {year:number; month:number; tasks:Task[]; categories:Categories; weekStart?:"Mon"|"Sun"}) {

  const [cursor, setCursor] = useState(new Date(year, month, 1));
  const cells = useMemo(()=>monthMatrix(cursor.getFullYear(), cursor.getMonth(), weekStart), [cursor, weekStart]);
  const weekLabels = weekStart==="Mon"
    ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const nav = (d:number)=>{ const x=new Date(cursor); x.setMonth(x.getMonth()+d); setCursor(x); };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <button onClick={()=>nav(-1)} className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700">‹</button>
        <h2 className="text-lg sm:text-xl font-semibold">
          {cursor.toLocaleString("en-US",{month:"long",year:"numeric"})}
        </h2>
        <button onClick={()=>nav(1)} className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700">›</button>
      </div>

      {/* Week labels */}
      <div className="grid grid-cols-7 text-center text-xs sm:text-sm opacity-70 mb-1">
        {weekLabels.map(w=> <div key={w} className="py-1">{w}</div>)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((date,i)=>{
          const isOther = date.getMonth()!==cursor.getMonth();
          const dayTasks = tasks.filter(t=>dateInTask(date,t));
          const dots = dayTasks.slice(0,3).map(t=>categories[t.category||"personal"]?.color || "#888");

          return (
            <div
              key={i}
              className={`rounded-xl p-1 sm:p-2 min-h-[60px] sm:min-h-[88px] bg-neutral-900 ${isOther?"opacity-40":""}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm">{date.getDate()}</div>
              </div>

              <div className="flex gap-1 mt-1">
                {dots.map((c,idx)=>(
                  <span key={idx} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{background:c}}/>
                ))}
                {dayTasks.length>3 && <span className="text-[10px] sm:text-xs opacity-70">+{dayTasks.length-3}</span>}
              </div>

              {/* รายชื่อสั้น ๆ เฉพาะจอใหญ่ */}
              <ul className="hidden md:block mt-2 space-y-1">
                {dayTasks.slice(0,2).map(t=>(
                  <li key={t.id} className="truncate text-[11px]">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                      style={{background: categories[t.category||"personal"]?.color || "#888"}}
                    />
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
