"use client";

import { useState } from "react";

export default function LeaveClassButton({
  classroomId,
  className,
  userId,
  onLeft,
}: {
  classroomId: string;
  className?: string;
  userId: string;
  onLeft?: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLeave() {
    setLeaving(true);
    onLeft?.(classroomId);
    try {
      const response = await fetch("/api/classroom/leaveClassById", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classroomId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to leave class");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Leave failed");
      }
    } catch (e) {
      console.error(e);
      alert("ออกจาก Class ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setLeaving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <button
        className="rounded-md px-2 py-1 text-sm border border-white/20 hover:bg-yellow-500/10 disabled:opacity-50"
        onClick={() => setConfirmOpen(true)}
        disabled={leaving}
        aria-label={`Leave ${className ?? "class"}`}
      >
        🚪 Leave
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white text-black rounded-xl p-4 w-80">
            <p className="mb-4">คุณแน่ใจว่าจะออกจาก Class "{className ?? "คลาสนี้"}" ไหม?</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1" onClick={() => setConfirmOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="px-3 py-1 rounded-md bg-yellow-600 text-white"
                onClick={handleLeave}
                disabled={leaving}
              >
                {leaving ? "กำลังออก..." : "ออกเลย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}