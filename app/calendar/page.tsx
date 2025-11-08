import fs from "node:fs/promises";
import path from "node:path";
import CalendarClient from "../components/CalendarClient";

async function getData() {
  const file = path.join(process.cwd(), "public", "tasks.json");
  const json = await fs.readFile(file, "utf-8");
  return JSON.parse(json);
}

export default async function Page() {
  const data = await getData();
  const now = new Date();
  return (
    <main className="max-w-6xl mx-auto p-3 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Calendar</h1>
      <CalendarClient year={now.getFullYear()} month={now.getMonth()} data={data} />
    </main>
  );
}

