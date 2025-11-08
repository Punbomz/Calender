"use client";
import CalendarMonth from "./CalendarMonth";

type Categories = Record<string, { color: string }>;
type Task = { id:string; title:string; start:string; end?:string; allDay?:boolean; category?:string; };

export default function CalendarClient({
  year, month, data,
}: {
  year:number; month:number;
  data: { settings?: { weekStart?: "Mon"|"Sun"; categories?: Categories }, tasks?: Task[] }
}) {
  return (
    <CalendarMonth
      year={year}
      month={month}
      tasks={data?.tasks ?? []}
      categories={data?.settings?.categories ?? {}}
      weekStart={data?.settings?.weekStart ?? "Mon"}
    />
  );
}

